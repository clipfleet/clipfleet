# Sistema de diseño

Alcanza para construir cualquier pantalla sin leer el código de los componentes. Muestra viva: `/ui-kit` (solo en desarrollo).

- Tokens: `src/app/globals.css` · Fuente: `src/app/layout.tsx` · Marca: `src/lib/brand.ts` (el nombre sale siempre de `BRAND.name`; nadie lo escribe a mano)
- Primitivos: `src/components/ui/*` · Marco: `src/components/shell/*` · Dominio: `src/components/domain/*` · Formularios: `src/components/forms/*`

---

## 1. Principios

**El producto.** El punto de encuentro entre contratadores y gestores de multicuentas, y la herramienta con la que el contratador gestiona a su equipo: rendimiento por persona, aprobación de videos y vistas, y el cálculo de cuánto le corresponde a cada uno. La plata no pasa por la plataforma y no hay comisión: acá se calcula la liquidación, el contratador marca "pagado" y quien cobró lo confirma.

**Claro y sobrio.** Tiene que leerse como infraestructura: plata y confianza. Cinco reglas:

1. **Blanco, grises y un solo acento.** El verde pino (`accent`) marca la acción principal, los links, el foco y la selección. Nada más lleva color, salvo los estados (píldoras de fondo tenue).
2. **Una sola familia tipográfica.** Host Grotesk para texto, títulos y cifras. Títulos en peso 600 con tracking ajustado. Sin mayúsculas sostenidas, sin monoespaciada para cifras (la mono del sistema solo aparece en links que se copian).
3. **Líneas finas, no cajas pesadas.** Contenedores con línea gris de 1px y radio de 10px; controles con radio de 6px. Dos sombras: la de los controles y la de la captura de producto de la landing.
4. **Los números mandan.** Cifras con numerales tabulares, alineadas a la derecha. Lo adeudado va en peso medio; lo demás, normal. Sin dato se muestra "—", nunca cero inventado.
5. **Aire.** Ante la duda, espacio en blanco.

**Minimalismo: una idea por pantalla.** Antes de agregar algo, dos preguntas; si la respuesta es sí, no va:

1. ¿Este texto explica algo que la pantalla ya muestra?
2. ¿Este dato deja igual la decisión que la persona toma en esta pantalla?

### Presupuestos (son límites, no objetivos)

| Qué | Límite |
|---|---|
| Landing | Una pantalla, a lo sumo una y media: titular, una frase, las dos entradas y la captura de producto (`ProductPreview`). ≤ 100 palabras. Sin prueba social, sin tarifas, sin simuladores |
| Encabezado de página | Título y acciones. Sin descripción, salvo que evite un error real |
| `StatGroup` | Máximo 3 `Stat`. Sin `note`, salvo que el número sea ambiguo sin ella |
| Tabla de equipo | Persona, Videos, Vistas, Costo / 1.000, Pagado, Adeudado. Lo que espera revisión va como badge junto al nombre |
| Detalle de contratación | La tabla de videos es la pantalla. Arriba, solo lo que tiene a la otra parte esperando (una liquidación por pagar o un cobro por confirmar). Liquidaciones, mensajes y finalizar: plegados |
| Perfil público | Nombre, una línea, 4 números (`TrackRecord`), una acción; insignias ganadas (`BadgeList`, una por familia) y calendario de actividad (`ActivityCalendar`) solo si hay actividad |
| Estados vacíos | Una línea y, si existe, la acción |
| Formularios | Una columna, ancho contenido, solo los campos que hacen falta. Lo opcional va detrás de "Más opciones". `hint` solo si evita un error |
| Navegación y pie públicos | Trabajos, Talento, Ingresar / Registrarme |

No se sacan: los montos y el desglose por video de una liquidación (son lo que genera confianza).

---

## 2. Voz

Español rioplatense con voseo. Directo, sin marketing, sin signos de exclamación, sin emojis.

- **Voseo siempre**: "publicá", "tenés", "podés".
- **Los botones dicen lo que pasa**: "Publicar búsqueda", "Liquidar $ 28.560", "Marcar como pagado", "Confirmar que cobré", "Invitar por link". El mensaje de éxito usa la misma palabra.
- **Errores**: qué pasó y cómo se arregla. "Indicá cuánto pagás cada 1.000 vistas."
- **Vacíos**: un hecho y, si existe, el siguiente paso. Una línea.
- **Sin dato ≠ cero**: lo que no se puede calcular o todavía no existe se muestra "—".

### Qué es multicuentas (y cómo no hablar de eso)

Son **cuentas descartables** que quien trabaja crea cuando lo contratan, para subir el contenido del contratador de forma masiva. No son cuentas propias que se hacen crecer ni un activo de nadie.

- Quien trabaja se presenta por **resultados**: vistas, videos aprobados, contrataciones. Nunca por cuentas, seguidores o audiencia.
- No escribas "tus cuentas", "cuentas propias", "tu audiencia". El campo "Cuenta" al cargar un video solo sirve para ubicar el video.
- No hay otros oficios ni categorías.
- No hay comisión, saldo, depósitos ni retiros: no los menciones. Los pagos se acuerdan y se hacen por fuera, entre las partes.

### Vocabulario fijo

| Concepto | Se dice | No se dice |
|---|---|---|
| `Job` | búsqueda | oferta, aviso |
| `Application` | postulación | aplicación |
| `Contract` | contratación ("Mis trabajos" para quien trabaja) | contrato |
| `Deliverable` | video | entrega, entregable |
| `Payout` | liquidación; "liquidar", "marcar como pagado", "confirmar que cobré" | payout, transferir |
| `hirer` | contratador ("Tengo contenido") | cliente |
| `worker` | trabajador en el panel; "Subo videos" en público | freelancer, clipper, editor |
| `payRule` | regla de pago; "cada 1.000 vistas" | CPM, tarifa |
| `Job.slots` | cupos | puestos |
| terminar un `Contract` | finalizar | cerrar, dar de baja |

Los textos de estado (`Abierta`, `Para revisar`, `Aprobado`, `Por pagar`, `Pago informado`, `Cobro confirmado`…) viven en `src/lib/domain/labels.ts`: usá siempre ese mapa con `Badge`.

Formato: plata con `Money` (centavos enteros → `$ 1.234,50`); números con `Num` (84 mil · 1,2 M; completo con `compact={false}`); fechas con `formatShortDate` / `formatDate` (hora de Buenos Aires); usuarios como `@usuario`.

---

## 3. Tokens

### Tipografía

Una familia: **Host Grotesk** (variable, vía `next/font/google`, expuesta como `--font-app`). Es una grotesca de ancho uniforme: cambiar de peso no cambia el ancho del texto, y sus cifras son tabulares. Para cambiarla se toca una línea en `layout.tsx`.

| Clase | Qué es | Dónde |
|---|---|---|
| `type-display` | Peso 600, tracking −0.035em, interlínea 1.04 | Titular de la landing (`text-[2.375rem] sm:text-5xl lg:text-[3.5rem]`) |
| `type-page` | 24px / 32px, 600, −0.02em | `h1` (lo pone `PageHeader`) |
| `type-title` | 15px / 22px, 600 | Título de panel o de sección |
| *(base)* | 14px / 20px, 400 | Texto. Prosa larga: `text-[0.9375rem] leading-relaxed` |
| `type-label` | 13px / 18px | Rótulo de un dato. Con `text-ink-3` |
| `tabular-nums` | Numerales tabulares | Cifras. `Money`, `Num` y las celdas `numeric` ya lo ponen |
| `font-mono` | Mono del sistema | Solo links y códigos que se copian (`CopyField`) |
| `link` · `link-row` | Link de texto (acento) · link de fila (hereda el color, acento al pasar) | Dentro de un párrafo · el nombre que lleva al detalle en una tabla |

Tamaños en uso: `text-xs` (12) · `text-[0.8125rem]` (13) · `text-sm` (14) · `text-[0.9375rem]` (15) · `text-base` (16) · cifras `text-2xl` (24). Pesos: 400, 500 (énfasis, botones, encabezados de fila) y 600 (títulos y cifras). Mayúsculas sostenidas: en ningún lado.

### Color

La paleta por defecto de Tailwind está desactivada: solo existen estos tokens.

| Token | Valor | Uso |
|---|---|---|
| `ink` · `ink-2` · `ink-3` | `#14181c` · `#4b535c` · `#646c76` | Texto principal / secundario / rótulos |
| `ink-4` | `#9aa1a9` | Decorativo (íconos, borde al pasar). Nunca texto que haya que leer |
| `surface` | `#ffffff` | Fondo |
| `wash` · `wash-2` | `#f7f8f9` · `#eef0f2` | Gris de apoyo (barra lateral, pie de tabla, vacíos) / hover y relleno |
| `line` · `line-strong` | `#e5e8ec` · `#cdd2d8` | Contenedores y filas / borde de controles |
| `accent` · `accent-hover` | `#0c6b4e` · `#09573f` | Acción principal, links, foco, selección |
| `accent-soft` · `accent-line` | `#e8f3ee` · `#c2ddd0` | Fondo y línea de lo seleccionado o lo que espera una acción |
| `positive` · `warning` · `negative` · `info` (+ `-soft`, `-line`) | | Estados: texto / fondo tenue / línea |
| `white` | | Texto sobre el acento |

Todos los pares texto/fondo cumplen AA (el más justo, `ink-3` sobre `wash-2`, da 4,66:1). El acento se usa en: botón `primary`, links, anillo de foco, radio marcado, ícono del ítem activo de la navegación, contadores de pendientes y el símbolo de la marca. En nada más.

### Forma

- Radios: `rounded-md` (6px, controles y botones) · `rounded-lg` (10px, contenedores) · `rounded-full` (píldoras, avatares) · `rounded-sm` (4px, foco de links).
- Líneas: contenedores y filas `border-line`; controles `border-line-strong`. Siempre 1px. No hay contornos de tinta.
- Sombras: `shadow-xs` (controles y botones) · `shadow-raised` (solo `ProductPreview`). Los paneles no llevan sombra.
- Foco: anillo de 2px del color de acento, global. En los controles de formulario, borde de acento más un halo tenue. No lo saques.
- Movimiento: transiciones de color de 100–150 ms en hover y foco. Nada decorativo. Se respeta `prefers-reduced-motion`.

### Espaciado

Márgenes de página `px-4 sm:px-6 lg:px-8` · ancho máximo `max-w-page` (70rem) · formularios `max-w-form` (30rem) o `max-w-2xl` (con filas) · entre bloques `gap-6` · entre campos `gap-5` · entre botones `gap-2`. Cortes: `sm` 640 · `md` 768 · `lg` 1024 (aparece la barra lateral). Se diseña primero para 375px.

---

## 4. Primitivos (`@/components/ui/*`)

Presentacionales y sin datos. Todos aceptan `className` para layout.

**Button · ButtonLink** — `variant`: `primary` (una por pantalla) · `secondary` · `ghost` · `danger`. `size`: `sm` · `md` · `lg`. `block`. `Button` suma `pending` y `pendingLabel` y acepta todo lo de `<button>` (`type="button"` por defecto). `ButtonLink` acepta todo lo de `next/link`. Dentro de una fila de tabla, las acciones van en `secondary` y `ghost`: el `primary` queda para la acción de la pantalla.

```tsx
<ButtonLink href="/app/busquedas/nueva">Publicar búsqueda</ButtonLink>
<Button variant="secondary" size="sm">Copiar</Button>
```

**Field** — `label`, `hint?`, `error?`, `optional?`, `children` (un control). Asocia label, ayuda y error sin JS. La ayuda va debajo del control. Los campos son obligatorios salvo `optional`.

```tsx
<Field label="Canal o marca" hint="Con este nombre aparecen tus búsquedas.">
  <Input name="brandName" required />
</Field>
```

**Input** — todo lo de `<input>` + `size?: "md" | "sm"` (`sm` solo dentro de filas de tabla), `leading?`, `trailing?` (adornos: `"$"`, `"vistas"`). Ocupa el 100% salvo que le pases un ancho (`className="w-28"`). Los montos se cargan en pesos.

**Select** — nativo. `options?`, `placeholder?`, `size?`. **Textarea** — nativo, `rows` 4.

**RadioCards** — elección única entre 2 a 4 opciones. `name`, `legend`, `options: { value, title, description? }[]`, `defaultValue?`, `columns?: 1 | 2 | 3`, `hint?`, `error?`, `required?`.

**Disclosure · DisclosureGroup** — sección plegada (`<details>`, sin JS). `title`, `meta?` (cantidad), `defaultOpen?`, `variant?: "panel" | "plain"`. `panel` para lo secundario de una pantalla (varias seguidas van dentro de `DisclosureGroup`); `plain` para "Más opciones" en un formulario. Los campos que queden adentro se envían aunque esté cerrada.

```tsx
<DisclosureGroup>
  <Disclosure title="Liquidaciones" meta={2}>…</Disclosure>
  <Disclosure title="Mensajes">…</Disclosure>
</DisclosureGroup>
```

**Badge** — `tone?: neutral | positive | warning | negative | info`, `icon?`. Píldora de fondo tenue; el texto dice el estado.

**Panel** — contenedor. `title?`, `description?`, `actions?`, `footer?`, `padded?` (`false` si el cuerpo es una tabla), `headingLevel?`. No anides paneles.

**Table · THead · TBody · TFoot · TR · TH · TD**

- `Table`: `caption` (obligatorio), `layout?: "stack" | "scroll"`, `minWidth?` (640).
- `TR`: `tone?: "muted"` (lo finalizado, lo vencido).
- `TH` y `TD`: `numeric?`, `align?`, `hideBelow?: sm | md | lg | xl`. `TH`: `width?`, `scope?` (`scope="row"` es el encabezado de la fila: la primera celda). `TD`: `label?`, `primary?`, `actions?`, `muted?`.
- **`layout="stack"`** es lo normal en el panel: debajo de 640px cada fila es una ficha (título + "rótulo — valor" + acciones). Cada `TD` con dato necesita `label`. Las celdas vacías no ocupan lugar.
- **`layout="scroll"`** para listas cortas de pocas columnas (directorio, detalle de una liquidación): con `minWidth={0}` y `hideBelow` en las columnas secundarias entra en 375px.
- La primera celda es `TH scope="row"` con el nombre (`link-row` al detalle), los badges que piden acción al lado y, debajo, una línea chica de contexto en `text-ink-3`. Un link por fila.
- `TFoot` con totales si la tabla suma.

```tsx
<Panel padded={false}>
  <Table caption="Rendimiento por persona" layout="stack">
    <THead><TR><TH>Persona</TH><TH numeric>Vistas</TH><TH numeric>Adeudado</TH></TR></THead>
    <TBody>
      <TR>
        <TH scope="row"><Link href={…} className="link-row">Brenda Sosa</Link></TH>
        <TD numeric label="Vistas"><Num value={1_240_000} /></TD>
        <TD numeric label="Adeudado"><Money cents={1_864_000} className="font-medium text-ink" /></TD>
      </TR>
    </TBody>
  </Table>
</Panel>
```

**StatGroup · Stat** — las cifras que resumen una pantalla, sin recuadro: en fila con una línea fina entre una y otra; en angosto, apiladas como "rótulo — valor". `StatGroup`: `cols?: 1 | 2 | 3`, `label?`. `Stat`: `label`, `value` (`null` → "—"), `note?`.

**Money** — `cents` (centavos enteros; `null` → "—"), `decimals?: auto | always | never`. **Num** — `value`, `compact?`, `unit?`.

**PageHeader** — `title`, `actions?`, `back?: { href, label }`, `meta?`, `description?` (solo si evita un error). Pone el único `h1`.

**EmptyState** — `title`, `description?`, `action?`, `flush?` (dentro de un `Panel padded={false}`).

**Notice** — `tone?: success | error | warning | info`, `title?`, `children?`, `action?`.

**Avatar** — `name`, `size?: sm | md | lg`. Iniciales en un círculo neutro; decorativo.

**Íconos** (`ui/icons`) — 16px, trazo de 1.5, decorativos: `CheckIcon`, `AlertIcon`, `InfoIcon`, `CrossIcon`, `ArrowRightIcon`, `ArrowLeftIcon`, `ChevronDownIcon`, `ChevronRightIcon`, `ExternalIcon`, `StarIcon` y los de navegación (`TeamIcon`, `SearchIcon`, `ReceiptIcon`, `UserIcon`, `BriefcaseIcon`, `SendIcon`, `GridIcon`). Nunca solos como botón.

**Formato** (`ui/format`): `formatMoney`, `formatInt`, `formatCompact`, `formatRating`, `formatShortDate`, `formatDate`, `isoDate`, `initials`.

---

## 5. Formularios (`@/components/forms/*`)

**ActionForm · FormSubmit** — el formulario estándar. `ActionForm`: `action`, `className` (el layout lo ponés vos), `resetOnSuccess?`, `feedback?: "block" | "inline"`. Muestra el mensaje que devuelve la acción y conserva lo escrito ante un error. `feedback="inline"` es obligatorio en formularios en línea (celdas de tabla, `actions` de un encabezado o de un panel). `FormSubmit`: props de `Button` + `confirm?` (pregunta antes de enviar).

```tsx
<ActionForm action={createJob} className="flex max-w-2xl flex-col gap-5">
  <Panel>…campos…</Panel>
  <div><FormSubmit pendingLabel="Publicando…">Publicar búsqueda</FormSubmit></div>
</ActionForm>

<ActionForm action={reviewDeliverable} feedback="inline" className="flex flex-wrap items-center gap-2 sm:justify-end">
  <input type="hidden" name="deliverableId" value={id} />
  <FormSubmit size="sm" variant="secondary" name="decision" value="approved">Aprobar</FormSubmit>
</ActionForm>
```

**PayRuleFields** — la regla de pago. Tres tipos; cada uno muestra un solo campo obligatorio. Mínimo de vistas, tope y fijo adicional quedan detrás de "Más opciones". Sin props ni JavaScript.

**CopyField** — `value`, `label`. Texto de solo lectura con "Copiar" (links de invitación, link del perfil).

Reglas: filas de campos con `grid items-start gap-4 sm:grid-cols-…` (la ayuda va debajo del control, así que los labels alinean arriba). Botón principal primero; "Cancelar" (`ghost`) solo si no hay otra forma de volver.

---

## 6. Marco (`@/components/shell/*`)

**AppShell** — `user: { name, username, role }`, `nav: { href, label, icon?, badge? }[]`, `signOutAction`, `children`. Escritorio: barra lateral clara de 240px con el ítem activo apenas despegado del fondo. Celular: barra superior con la marca y navegación fija abajo (ícono + rótulo). Da contenedor, márgenes y `gap`: las páginas devuelven un fragmento. Navegación: contratador → Equipo, Búsquedas, Liquidaciones, Perfil. Trabajador → Mis trabajos, Postulaciones, Perfil.

**PublicHeader** — `user: { name } | null`, `loginHref?`, `registerHref?`, `panelHref?`. **PublicFooter** — `user`, `loginHref?`, `panelHref?`: una línea fina, la marca y tres links.

**Wordmark · BrandMark** — `Wordmark`: `href?`, `size?: sm | md | lg`. El símbolo en el color de acento y el nombre (`BRAND.name`) en peso 600, sin recuadro; funciona con cualquier nombre corto. `BrandMark` es el símbolo solo: un triángulo de reproducción con un corte (un clip). Es el mismo dibujo de `src/app/icon.svg`.

---

## 7. Dominio (`@/components/domain/*`)

**JobList · JobRow** — la bolsa de trabajos como lista. `JobRow`: `href`, `title`, `brandName`, `payRuleSummary` (de `payRuleText(rule)`). Toda la fila es el link.

**TrackRecord** — `totalViews`, `avgViews`, `approvedDeliverables`, `completedContracts` (todos `number | null`). Cuatro cifras en un recuadro (2×2 en celular); `null` o 0 → "—". Es el único lugar del perfil donde aparecen esos números.

**PayRuleSummary** — `fixedPerDeliverable`, `variable` (`null` | `{ type: "cpm", ratePerThousand, minViews?, capPerDeliverable? }` | `{ type: "tiers", tiers }`), montos en centavos; `variant?: "block" | "inline"`. `payRuleText(rule)` devuelve la misma regla en una línea.

**ReviewItem** — `authorName`, `authorContext?`, `rating`, `comment`, `date`. **Rating** — `value`; solo para reseñas.

**ProductPreview** — la pantalla de Equipo armada con los componentes reales y datos ficticios, enmarcada como captura y rotulada "Ejemplo". Solo en la landing. Va `inert`: no recibe foco ni clics.

---

## 8. Cómo componer pantallas

**Página del panel** — en este orden, y solo lo que haga falta:

```tsx
<>
  <PageHeader title="Equipo" actions={…} />
  <StatGroup cols={3}>…</StatGroup>          {/* si hay plata o vistas que resumir */}
  <Panel padded={false}><Table layout="stack" …/></Panel>
</>
```

**Listado público** — contenedor `mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12`, `PageHeader` con solo el título y una lista (`JobList`) o una tabla (directorio de talento). Sin filtros mientras haya un solo tipo de trabajo. Sin resultados: `EmptyState`.

**Detalle de contratación** — `PageHeader` (título, quién, acciones; "Liquidar $ X" si hay adeudado) → lo que espera a quien mira (liquidación por pagar con "Marcar como pagado", o pago informado con "Confirmar que cobré"), sobre `accent-soft` → `StatGroup` de 3 → `Panel` "Videos" con la regla de pago como descripción, el formulario de carga (trabajador) y la tabla → `DisclosureGroup` con liquidaciones, mensajes y finalizar o reseñas. Las acciones secundarias de una fila ("Actualizar vistas", "Reportar vistas") se abren en el lugar: la tabla no repite controles en todas las filas.

**Liquidaciones** — `StatGroup` de 2 → "Por pagar": un `Panel` por liquidación (persona, período, "Marcar como pagado" y el detalle por video con total) → `Panel` "Pagadas" con el estado de cada una.

**Formulario** — un `Panel` (`max-w-form` o `max-w-2xl`), campos mínimos, lo opcional en "Más opciones", un botón.

**Perfil público** — avatar, nombre, `@usuario · presentación` y una acción → `TrackRecord` con una línea de procedencia → solo si existen: insignias (`BadgeList`), actividad (`ActivityCalendar` dentro de un `Panel`), trabajos (tabla de 3 columnas) y reseñas.

**Páginas angostas públicas** (ingresar, registro, invitación) — envoltorio `flex-1 bg-wash`, adentro `mx-auto max-w-form px-4 py-12 sm:py-16` con `h1` (`type-page`) y un `Panel className="shadow-xs"`.

**Landing** — una sección: a la izquierda titular y una frase; a la derecha, las dos entradas como una lista de dos filas y la línea sobre pagos y costo. Debajo, `ProductPreview`. Nada más.

**Estados que toda pantalla resuelve** — vacío (`EmptyState`), sin dato ("—"), error y éxito (los muestra `ActionForm`), en espera (`FormSubmit` con indicador; sin esqueletos).

---

## 9. Accesibilidad

Resuelto por el sistema: foco visible, contraste AA, labels asociados, grupos con `fieldset`/`legend`, tablas con `caption`, `scope` y roles (el modo ficha no pierde semántica), `aria-current` en la navegación, `aria-busy` en botones en espera, salto al contenido, `prefers-reduced-motion`.

En cada pantalla: un solo `h1` (lo pone `PageHeader`), `caption` descriptivo en cada tabla, ningún estado comunicado solo con color, ningún control sin texto, cualquier ancestro `grid` o `flex` de una tabla con `min-w-0`.
