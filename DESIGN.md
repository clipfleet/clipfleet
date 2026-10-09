# DESIGN — ClipFleet

Estado: **aprobado el 2026-09-30; modelo vigente revisado el 2026-10-02** (ver "Modelo vigente" justo abajo). Cambios que contradigan este documento se comunican antes de implementarse.

## Modelo vigente (2026-10-02)

Decisiones del dueño que reemplazan lo que diga el resto del documento donde haya conflicto:

- **La plataforma conecta a las partes y le da herramientas al contratador para gestionar el vínculo.** Ese es todo el producto por ahora.
- **Sin comisión y sin plata en la plataforma.** Los pagos se hacen por fuera, exclusivamente entre las dos partes. La plataforma calcula cuánto corresponde según la regla y las vistas aprobadas (liquidación), el contratador marca "pagado" y el trabajador confirma el cobro. No hay saldo, depósitos, retiros ni panel de administración.
- **Solo gestión de multicuentas** (definición en §1).
- **Interfaz minimalista y profesional.** Dirección visual elegida: clara y sobria (fondo blanco, grises, un acento, tipografía sans precisa, líneas finas, mucho aire; referencias Stripe, Mercury, Ramp). Tiene que leerse como infraestructura de una industria, no como un proyecto de fin de semana.
- **Nombre:** ClipFleet. Vive en una sola constante, `src/lib/brand.ts`.

Consecuencias en el modelo:

- `platform_settings.payments_mode = external` y comisión 0. `Payout` tiene `settlement` (`external` hoy) y `confirmedAt` (confirmación de cobro del trabajador).
- Estados de una liquidación: por pagar → pago informado → cobro confirmado.
- El trayecto del trabajador cuenta contrataciones con al menos una liquidación marcada como pagada. La reputación del contratador son sus pagos confirmados por quienes cobraron.
- **Riesgo nuevo:** sin plata de por medio, inflar un perfil con contrataciones falsas no cuesta nada, y un "pagado" que el trabajador no confirma queda en disputa sin árbitro. Para la prueba de mercado se acepta.
- **Lo que queda guardado para cuando los pagos pasen por la plataforma:** libro contable, comisión (`splitPayout`), depósitos (`PaymentProvider`), retiros (`PayoutProvider`) y sus tablas siguen en `src/lib` con tests, sin pantallas. Las secciones "Modelo monetario" y "La sección monetaria tiene que poder mutar" describen ese modo futuro.

## Datos de pago entre las partes (aprobado e implementado el 2026-10-08)

**Problema:** al pagar, el contratador no sabe a dónde transferir y el gestor no sabe de quién va a recibir.

**Qué se construye**

- El **gestor** carga en su perfil sus datos de cobro: titular de la cuenta y alias, CBU o CVU.
- El **contratador** carga en su perfil el titular de la cuenta desde la que paga.
- En cada liquidación por pagar, el contratador ve el monto junto al alias/CBU/CVU y el titular del gestor, con botón para copiar.
- El gestor ve en esa liquidación a nombre de quién le va a llegar la transferencia.
- Al marcar "pagado", la liquidación guarda una copia de a qué cuenta y a nombre de quién se pagó. Si después alguien cambia sus datos, el registro de ese pago no cambia.

**Fuera de alcance:** mover la plata (sigue siendo por fuera), verificar que la cuenta pertenezca al titular, varias cuentas por persona, cuentas del exterior.

**Modelo de datos**

```
PaymentDetails   userId (PK), holderName, account?, accountKind?(alias|cbu|cvu), updatedAt
Payout           + paidToAccount?, paidToHolder?, paidFromHolder?   -- copia al marcar pagado
```

Una sola tabla para los dos roles: el gestor completa titular y cuenta; el contratador solo titular. Va en tabla propia, no en los perfiles, porque los perfiles se leen enteros en las páginas públicas y estos datos no pueden viajar ahí ni por error. Con RLS, como todas.

**Reglas**

- **Quién ve qué:** los datos de cobro de un gestor solo los ve el contratador de una contratación suya, y solo en las pantallas de liquidación. El titular del contratador solo lo ven los gestores que tienen una contratación con él. Nunca aparecen en perfiles públicos, el directorio ni las búsquedas. La lectura se hace en las consultas de contratación y liquidaciones, que ya filtran por pertenencia.
- **Validación:** alias de 6 a 20 caracteres (letras, números, punto, guion); CBU de 22 dígitos con sus dígitos verificadores; CVU (22 dígitos que empiezan con 000) solo por formato, para no rechazar uno válido. El tipo se detecta solo.
- **Cambiar los datos de cobro pide la contraseña actual**, y tiene límite de intentos. Es la defensa contra el fraude típico: alguien entra a la cuenta de un gestor y cambia el alias para desviar el próximo pago.
- **Aviso de cambio:** si la cuenta del gestor no es la misma a la que ese contratador le pagó la última vez, la liquidación lo avisa para que confirme por otro canal antes de transferir.
- **No son obligatorios para postularse ni para ser contratado.** Si faltan al momento de pagar, el contratador ve "todavía no cargó sus datos de cobro" y el gestor ve el pedido de cargarlos en su panel.

**Pantallas que cambian**

| Pantalla | Cambio |
|---|---|
| `/app/perfil` (gestor) | Sección "Datos de cobro": titular, alias/CBU/CVU, contraseña actual para guardar |
| `/app/perfil` (contratador) | Campo "Titular de la cuenta desde la que pagás" |
| `/app/liquidaciones` y detalle de contratación (contratador) | Junto al monto: a dónde transferir, con copiar, y el aviso si cambió |
| Detalle de contratación (gestor) | "Te transfiere: titular" en la liquidación pendiente; pedido de cargar datos si faltan |

**Riesgos**

1. **Son datos personales sensibles.** Un alias o CBU con nombre permite identificar a alguien. Se minimiza lo que se guarda y quién lo ve, pero conviene mencionarlo en los términos y la política de privacidad.
2. **La plataforma no verifica titularidad.** Si un gestor carga mal su alias, el pago va a otra persona. Mitigación: se muestra el titular declarado para que el contratador lo compare con el que le muestra su banco antes de confirmar.
3. **Cuenta de gestor comprometida.** Cubierto en parte por la contraseña al cambiar datos y el aviso de cambio; sin verificación de email ni segundo factor, sigue siendo el punto más débil.

## Despliegue, seguridad y versionado (aprobado el 2026-10-02)

**Objetivo:** tener el sitio publicado mientras sigue en desarrollo, con los controles de seguridad operativos desde ahora, y que cada cambio subido a GitHub se publique solo.

**En producción desde el 2026-10-02:** https://www.clipfleet.app · repositorio privado `clipfleet/clipfleet` (cuentas propias del proyecto desde el 2026-10-08) · base y funciones en la misma región (us-east-1 / iad1).

**Infraestructura**

| Pieza | Elección | Por qué |
|---|---|---|
| Hosting | Vercel, proyecto `clipfleet` en la cuenta del proyecto | Publica GitHub Actions con un token (el plan gratuito de Vercel solo publica commits del dueño de la cuenta), HTTPS y vistas previas por rama sin configurar nada |
| Base de datos | Supabase (Postgres, plan gratuito) vía Vercel Marketplace, usada solo como base de datos | Postgres real con conexión cifrada; las variables se cargan solas en Vercel. Las migraciones corren en cada despliegue a producción. Todas las tablas tienen Row Level Security sin políticas, para que la API pública de datos de Supabase no exponga nada: la app entra por conexión directa como dueña |
| Repositorio | GitHub privado `clipfleet/clipfleet` | `main` publica a producción; cada rama o pull request genera una vista previa |
| Control de cambios | GitHub Actions corre tipos, lint y tests en cada push; Dependabot avisa de dependencias vulnerables | Que nada roto llegue a producción |

**Autenticación:** se mantiene Better Auth (gratis, usuarios en nuestra base, sin servicio externo) y se endurece:

- Contraseñas de 10+ caracteres, rechazadas si figuran en filtraciones conocidas (consulta anónima a Have I Been Pwned); se guardan con hash scrypt.
- Límite de intentos de ingreso y de registro por IP y por cuenta, guardado en Postgres.
- Cookies de sesión `HttpOnly`, `Secure`, `SameSite=Lax`; sesiones con vencimiento y renovación.
- Mensajes de error que no revelan si un email existe.
- El rol nunca viene del navegador; no hay endpoints de autenticación expuestos fuera de los formularios.

**Controles de aplicación**

- **XSS:** todo se renderiza escapado por React; Content-Security-Policy estricta con nonce por request; los links que cargan los usuarios solo aceptan `http/https`.
- **Inyección SQL:** todas las consultas son parametrizadas (Drizzle); ninguna concatena texto del usuario.
- **CSRF:** las acciones del servidor verifican origen; cookies `SameSite`.
- **Clickjacking y afines:** `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Autorización:** cada acción y cada página verifican sesión, rol y pertenencia al recurso en el servidor. Se revisa una por una.
- **Validación:** largos, rangos y formatos de toda entrada en el servidor; topes en montos y vistas.
- **Abuso:** límite de frecuencia en postulaciones, mensajes, invitaciones y cargas.
- **Datos:** secretos solo en variables de entorno de Vercel, nunca en el repositorio; base con TLS; las páginas públicas no exponen emails; el sitio lleva `noindex` mientras esté en desarrollo.

**Riesgos y límites**

1. **Sin verificación de email ni recuperación de contraseña.** Requieren un servicio de envío de mails (hay planes gratuitos, pero necesita una cuenta y una clave). Hasta entonces se pueden crear cuentas con emails ajenos y quien olvida la contraseña no puede recuperarla.
2. **Plan gratuito de Vercel.** Es para uso no comercial, y con repositorio privado solo publica los commits del dueño de la cuenta: lo que suba el socio se publica cuando el dueño lo integra a `main`. Para un producto comercial con dos personas corresponde el plan Pro.
3. **Límites de frecuencia en Postgres:** suficientes para esta etapa; con mucho tráfico conviene moverlos a un almacén en memoria.
4. **Ninguna revisión reemplaza un test de penetración externo** antes de manejar plata o datos sensibles.

## 1. Qué construimos

Un marketplace + herramienta de gestión para la **gestión de multicuentas**:

- **Contratadores** (creadores, marcas) publican búsquedas y gestionan a su equipo en un CRM con rendimiento por persona.
- **Trabajadores** (gestores de multicuentas) ven búsquedas, se postulan y construyen un perfil con historial verificable.

**Qué es multicuentas:** cuentas descartables que el trabajador crea cuando lo contratan, para subir el contenido del contratador de forma masiva. No son cuentas que se hacen crecer ni un activo del trabajador: nadie se ofrece diciendo "tengo 12 cuentas". El trabajador se vende por resultados (vistas, videos, contrataciones), no por audiencia propia.

**Principio de interfaz:** minimalista. Una idea por pantalla, poco texto de ayuda, pocas métricas. La primera versión resultó abrumadora.

**Problema que resuelve:** hoy esto se coordina por Discord/WhatsApp/planillas. El contratador no sabe a quién le rinde cada peso y el trabajador no tiene forma de demostrar su historial.

**Objetivo del MVP:** validar mercado. Que un contratador pueda publicar, contratar (o invitar a su equipo existente), cargar reglas de pago por rendimiento, fondear y pagar por resultados desde la plataforma; que un trabajador pueda postularse, registrar entregas, cobrar y mostrar un perfil con métricas.

### Fuera de scope (MVP)

- Otros tipos de trabajo (edición, filmmaking, miniaturas): fuera por ahora. La categoría queda en el modelo para sumarlos después.
- Retiros automáticos al trabajador (en el MVP los procesa el admin a mano, ver §5).
- Suscripciones o planes pagos: el único ingreso es la comisión sobre resultados.
- Lectura automática de vistas en TikTok/Instagram (ver §6).
- Chat en tiempo real, notificaciones push, app móvil.
- Disputas/arbitraje, panel de administración completo, multi-idioma.
- Una misma cuenta con ambos roles.

## 2. Arquitectura

Monolito Next.js (App Router) desplegado en Vercel, con Postgres.

```
Navegador
   │
   ▼
Next.js App Router
 ├─ Páginas públicas (RSC): landing, bolsa de trabajos, directorio, perfil público
 ├─ /app (autenticado): panel contratador / panel trabajador
 ├─ Server Actions: toda mutación (publicar, postular, entregar, aprobar, liquidar)
 └─ lib/
     ├─ db/        esquema y queries (Drizzle)
     ├─ payrules/  motor de cálculo de pago por rendimiento (funciones puras, testeadas)
     ├─ ledger/    libro contable interno: saldos, reservas, liberaciones, comisión
     ├─ payments/  adaptador del proveedor de cobro (depósitos + webhook)
     ├─ stats/     métricas de perfil y CRM derivadas de entregas
     └─ views/     adaptadores de fuente de vistas (manual hoy, API después)
   │                         │
   ▼                         ▼
Postgres              Proveedor de pagos
```

Puntos clave:

- **`payrules`, `ledger` y `stats` son módulos puros**, sin dependencia de UI. Son el núcleo del producto y tienen tests obligatorios.
- **Todo movimiento de dinero es un asiento inmutable en `ledger`**; los saldos se calculan sumando asientos, nunca se editan.
- **`views` es una interfaz con adaptadores**, para poder sumar lectura automática sin tocar el resto.
- Las métricas del perfil **se derivan** de entregas y contrataciones; nadie las escribe a mano.

### Mapa de pantallas

| Ruta | Quién | Qué |
|---|---|---|
| `/` | público | Landing |
| `/trabajos`, `/trabajos/[id]` | público | Bolsa de búsquedas y detalle |
| `/talento`, `/t/[usuario]` | público | Directorio y perfil público con historial |
| `/app/busquedas` | contratador | Crear/gestionar búsquedas y postulaciones |
| `/app/equipo`, `/app/equipo/[id]` | contratador | **CRM**: tabla de trabajadores con rendimiento; detalle por contratación |
| `/app/equipo/invitar`, `/invitacion/[token]` | contratador / invitado | Sumar equipo existente por link, sin pasar por la bolsa |
| `/app/liquidaciones` | contratador | Qué se debe, a quién, por qué; aprobar y liberar pago |
| `/app/saldo` | contratador | Fondear saldo, ver reservado/disponible, movimientos |
| `/app/postulaciones` | trabajador | Estado de sus postulaciones |
| `/app/contrataciones`, `/app/contrataciones/[id]` | trabajador | Trabajos activos, cargar entregas, ver lo ganado |
| `/app/cobros` | trabajador | Saldo a favor, pedir retiro, historial |
| `/admin/retiros` | admin | Cola de retiros para procesar a mano |
| `/app/perfil` | ambos | Editar perfil |

## 3. Modelos de datos

```
User            id, role(hirer|worker), email, username, name, avatar
WorkerProfile   userId, headline, bio, categories[], portfolioLinks[], country
HirerProfile    userId, brandName, description, channels[]

Job             id, hirerId, title, description, category, platform, platformName,
                payRule(json),
                slots, status(open|paused|closed)
Application     id, jobId, workerId, message, status(pending|accepted|rejected)

Invite          id, hirerId, token, platform, platformName, payRule(json), expiresAt, usedBy

Contract        id, jobId?, hirerId, workerId, origin(job|invite),
                platform + platformName(snapshot), payRule(json, snapshot), feeRate(snapshot),
                status(active|ended), startedAt, endedAt
Deliverable     id, contractId, kind(post|file), url, platform, accountHandle,
                dueAt, submittedAt, status(submitted|approved|rejected),
                views, viewsSource(manual|api), qualityRating(1-5)
ViewSnapshot    id, deliverableId, views, capturedAt, source, evidenceUrl

Payout          id, contractId, periodStart, periodEnd, amount, fee, breakdown(json),
                status(pending|released), releasedAt
Account         id, ownerId?, kind(hirer|worker|platform_fees), currency
LedgerEntry     id, accountId, amount(±), type(deposit|payout|fee|withdrawal|refund),
                payoutId?, depositId?, withdrawalId?, createdAt   -- inmutable
Deposit         id, hirerId, amount, providerRef, status(pending|confirmed|failed)
Withdrawal      id, workerId, amount, destination, status(requested|sent|rejected),
                processedBy, processedAt
Review          id, contractId, authorId, targetId, rating, comment
Message         id, contractId|applicationId, authorId, body, createdAt
```

Relaciones: `Job 1—N Application`; una `Application` aceptada o un `Invite` usado genera un `Contract`; `Contract 1—N Deliverable 1—N ViewSnapshot`; `Contract 1—N Payout`; cada `Payout` liberado genera asientos en `LedgerEntry`.

`Contract.payRule` es una **copia** de la regla al momento de contratar: cambiar la búsqueda no altera acuerdos vigentes.

### Regla de pago (`payRule`)

El contratador la define por búsqueda. Tipos del MVP:

| Tipo | Ejemplo |
|---|---|
| `fixed` | $X por entrega aprobada (edición, filmación) |
| `cpm` | $X cada 1.000 vistas, con mínimo de vistas y tope opcionales |
| `tiers` | ≥10k vistas → $A; ≥100k → $B; debajo del primer escalón → $0 |

Combinables: base fija + variable. Moneda única por contrato.

### Métricas derivadas (perfil y CRM)

Vistas totales · vistas promedio por video · % de entregas a tiempo · calidad promedio · contrataciones completadas · tasa de recontratación · costo por 1.000 vistas (solo CRM).

## 4. Interfaces y contratos

**Motor de pago** (puro):

```ts
computePayout(rule: PayRule, deliverables: DeliverableFacts[]): {
  amount: number
  breakdown: { deliverableId: string; views: number; amount: number; reason: string }[]
}
```

**Fuente de vistas:**

```ts
interface ViewSource {
  supports(url: string): boolean
  fetchViews(url: string): Promise<{ views: number; capturedAt: Date }>
}
```

MVP: `ManualSource` (el trabajador reporta vistas + captura; el contratador aprueba). Opcional en MVP: `YouTubeSource` (API pública).

**Libro contable** (puro sobre asientos):

```ts
balance(accountId): { available: number }
releasePayout(payout): LedgerEntry[]   // -(monto+comisión) contratador, +monto trabajador, +comisión plataforma
```

`releasePayout` falla si el saldo del contratador no alcanza; es atómico (una transacción de DB) e idempotente por `payoutId`.

**Proveedor de pagos:**

```ts
interface PaymentProvider {
  createDeposit(hirerId, amount): Promise<{ checkoutUrl: string; providerRef: string }>
  verifyWebhook(req): DepositEvent   // confirma el depósito → asiento `deposit`
}
```

**Server Actions principales:** `createJob`, `applyToJob`, `decideApplication`, `createInvite`, `acceptInvite`, `submitDeliverable`, `reportViews`, `reviewDeliverable`, `startDeposit`, `generatePayout`, `releasePayout`, `requestWithdrawal`, `processWithdrawal` (admin), `endContract`, `leaveReview`.

**Autorización:** toda acción valida rol y pertenencia al contrato en el servidor. Perfiles públicos muestran métricas agregadas, nunca montos.

## 5. Decisiones técnicas

| Decisión | Elección | Por qué |
|---|---|---|
| Framework | Next.js App Router + TypeScript | Público con SEO + panel autenticado en un solo deploy |
| Datos | Postgres + Drizzle. En desarrollo, Postgres embebido (PGlite) si no hay `DATABASE_URL` | Modelo relacional; agregaciones para métricas; arrancar sin instalar nada |
| Auth | Better Auth (librería, usuarios en nuestra base), email + contraseña | No construir auth propia y poder correr y probar todo sin cuentas externas. Aislada en `lib/auth.ts` y `lib/session.ts` para poder cambiarla |
| Mutaciones | Server Actions + Zod | Sin capa de API separada |
| UI base | Tailwind + primitivos accesibles, re-estilizados | Accesibilidad sin look de plantilla |
| **Diseño UI/UX** | **Agente especializado** define sistema visual (tipografía, color, layout, tono) **antes** de construir pantallas | Evitar estética genérica de IA |
| Idioma | Español | Mercado inicial |

### Modelo monetario

**El dinero pasa por la plataforma y solo se cobra comisión sobre resultados pagados.** Sin suscripción, sin costo por publicar ni por usar el CRM.

Flujo:

1. El contratador **fondea su saldo** (depósito vía proveedor de pagos).
2. Los trabajadores entregan; las vistas se reportan y aprueban.
3. Al cierre del período se **genera la liquidación** con el motor de reglas.
4. El contratador la aprueba y se **libera**: el trabajador recibe el 100% de lo acordado y la plataforma cobra la **comisión encima**, al contratador.
5. El trabajador **pide el retiro**; en el MVP el admin lo transfiere a mano y lo marca enviado.

Si no hubo resultados, no hay liquidación y no se cobra nada.

**Por qué les conviene quedarse adentro:**

- **Trabajador:** ve que el contratador tiene fondos depositados antes de trabajar (insignia "fondos disponibles" en la búsqueda). En pago por rendimiento, el miedo a no cobrar es el problema principal; por fuera no tiene esa garantía.
- **Trabajador:** su historial verificable solo crece con trabajo pagado adentro.
- **Contratador:** paga solo por resultados verificados, con liquidación calculada automáticamente; el CRM es gratis mientras pague por ahí.
- **Contratador:** su reputación de pagador (liquidaciones liberadas a tiempo) atrae mejores trabajadores.

**Decisiones de alcance del MVP:**

- Depósitos automáticos por proveedor; **retiros manuales** por el admin. Evita integrar pagos salientes antes de validar.
- Comisión configurable (`feeRate`), copiada en cada contrato al crearse.
- El equipo invitado por link usa el mismo flujo y comisión.
- Proveedor de pagos: **depende del país y la moneda objetivo** (ver decisiones abiertas). Queda detrás de `PaymentProvider` para poder cambiarlo.

## 6. Riesgos y partes difíciles

1. **Verificación de vistas (el mayor).** TikTok e Instagram no dan vistas de videos de terceros por API pública. El MVP usa reporte manual + captura + aprobación, lo cual es fricción y es falseable. Automatizar implica OAuth de cada cuenta o un proveedor de scraping (costo, fragilidad, términos de uso). Si la prueba de mercado muestra que esto es lo que más valoran, es la primera inversión posterior.
2. **Custodia de dinero de terceros.** Recibir fondos del contratador y pagarle al trabajador tiene implicancias legales y fiscales (facturación de la comisión, retenciones, posible regulación como intermediario de pagos según el país). Hay que validarlo con un contador antes de operar con plata real.
3. **Proveedor de pagos.** La disponibilidad cambia por país (Stripe no opera para empresas argentinas; Mercado Pago sí, en pesos). Pagar a trabajadores de otros países suma costo y complejidad. Por eso los retiros son manuales en el MVP.
4. **Errores contables.** Un bug que libere dos veces o deje saldo negativo es plata real. Mitigación: asientos inmutables, liberación atómica e idempotente, tests del `ledger`.
5. **Disputas y fraude.** Vistas falsas o compradas, contracargos sobre depósitos ya liberados. MVP: aprobación del contratador antes de liberar y resolución manual por el admin.
6. **Fricción del fondeo.** Pedir depósito por adelantado puede frenar al contratador nuevo. Se mide en la prueba de mercado.
7. **Arranque en frío.** Sin trabajadores no hay contratadores y viceversa. Mitigación: invitar al equipo existente por link.
8. **Reputación manipulable.** Contrataciones falsas para inflar perfil. Mitigación: solo cuenta lo efectivamente pagado adentro, que cuesta comisión.
9. **Reglas de pago ambiguas.** ¿Vistas a qué fecha? ¿Qué pasa si el video se borra? Se fija: las vistas se congelan al cierre del período, con el último snapshot aprobado.
10. **Términos de las plataformas.** Crear cuentas descartables para publicar en masa va contra las reglas de TikTok, Instagram y YouTube sobre cuentas múltiples y spam: las cuentas pueden ser dadas de baja y el contenido removido. La plataforma solo registra resultados, no crea ni opera cuentas, pero el riesgo de baja lo corren trabajador y contratador y conviene decirlo en los términos de uso.

## Decisiones tomadas

- El dinero pasa por la plataforma; se cobra comisión solo sobre resultados pagados.
- Vistas manuales con captura y aprobación del contratador en el MVP.
- Invitar equipo existente por link entra en el MVP.

- Moneda inicial: pesos argentinos (ARS). Montos guardados en centavos enteros.
- Comisión inicial: 3%, cobrada encima al contratador.
- Retiros de trabajadores gestionados a mano por el equipo de la plataforma.

### La sección monetaria tiene que poder mutar

Comisión, quién la paga y cómo se retiran los fondos van a cambiar. Por eso:

- `platform_settings` (una fila, editable desde `/admin/configuracion`): `feeBps` (300), `feePayer` (`hirer`|`worker`), `withdrawalMode` (`manual`|`auto`), `currency`.
- Cada `Contract` copia `feeBps` y `feePayer` al crearse: cambiar la configuración no altera acuerdos vigentes.
- Depósitos detrás de `PaymentProvider`; retiros detrás de `PayoutProvider` (`ManualPayoutProvider` hoy: cola para el admin). Cambiar de proveedor o automatizar retiros no toca el `ledger` ni las pantallas.
- El reparto de cada liquidación sale de una única función pura (`splitPayout`), que es el único lugar donde vive la regla de comisión.

## Ajustes durante la implementación

Precisiones tomadas al construir. Ninguna cambia el alcance aprobado; se listan para que el documento refleje el código.

- **Auth:** se usó Better Auth en vez de un proveedor gestionado (ver §5). Sin verificación de email ni recuperación de contraseña todavía: hacen falta antes de abrir al público y requieren un servicio de envío de mails.
- **Liquidación incremental:** cada entrega cobra la diferencia entre lo que ganó con sus vistas aprobadas a hoy y lo ya cobrado. Así las vistas que siguen creciendo se pagan en liquidaciones posteriores sin pagar dos veces. El desglose vive en la tabla `payout_items` (no en un JSON dentro de `Payout`), con las vistas congeladas al generar.
- **`Payout`** guarda `amount` (lo acordado), `fee`, `hirerDebit` y `workerCredit`, para que quién paga la comisión pueda cambiar sin recalcular historia.
- **Entregas con fecha:** el contratador puede pedir una entrega con fecha (`requested`); sobre esas se calcula la puntualidad. Las publicaciones que el trabajador sube por su cuenta no tienen fecha y no cuentan para esa métrica.
- **Vistas:** además del reporte del trabajador, el contratador puede cargar las vistas que verificó él mismo. La evidencia es un link a la captura; no hay subida de archivos.
- **Invitaciones:** cada link sirve para una persona y vence a los 14 días; se pueden generar hasta 30 por vez.
- **Mensajes:** solo dentro de una contratación (no en la postulación, que ya lleva su mensaje).
- **Trayecto público:** solo muestra contrataciones con al menos un pago liberado.
- **Depósitos:** adaptador de Mercado Pago (Checkout Pro + webhook) y, sin credenciales y fuera de producción, un checkout simulado.
- **Admin:** las cuentas admin se crean con `pnpm admin:promote <email>`; no hay registro de admins.
- **Solo multicuentas (2026-10-01):** se quitaron de la interfaz las categorías, las entregas de archivo, el pedido de entregas con fecha y la métrica de puntualidad, que existían para edición y filmación. El soporte en datos y acciones queda para cuando vuelvan esos tipos de trabajo.
- **Plataforma por búsqueda (2026-10-08):** una vista no vale lo mismo en TikTok, Instagram o YouTube, así que cada búsqueda e invitación elige una sola plataforma y la regla de pago vale para las vistas de esa plataforma. Para pagar distinto en otra plataforma se publica otra búsqueda. La contratación copia la plataforma y solo acepta videos de ella. Las búsquedas anteriores no tienen plataforma y no se restringen. Los logos se muestran en un solo color, sin modificar y siempre junto al nombre. Si la plataforma no está en la lista, se elige "Otra" y se escribe el nombre (`platformName`); esas contrataciones aceptan cualquier link que no sea de TikTok, Instagram o YouTube.
- **Cobros del gestor (2026-10-08):** `/app/cobros` concentra la plata del gestor de todas sus contrataciones, como Liquidaciones lo hace para el contratador: pagos informados por confirmar (con el botón ahí mismo y a nombre de quién llega la transferencia), lo que le deben por trabajo (liquidado o todavía sin liquidar) y lo ya cobrado. No agrega datos nuevos: lee liquidaciones y contrataciones existentes.
