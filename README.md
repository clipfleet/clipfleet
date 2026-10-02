# Cliperia

Punto de encuentro entre creadores de contenido y gestores de multicuentas: gente que crea cuentas descartables para subir ese contenido de forma masiva. Bolsa de búsquedas, perfiles con trayecto, y herramientas para que el contratador gestione a su equipo: rendimiento por persona y cálculo de lo que le corresponde a cada uno. Los pagos se hacen por fuera, entre las partes; la plataforma no cobra comisión.

El diseño del producto está en [DESIGN.md](DESIGN.md) y el sistema visual en [docs/design-system.md](docs/design-system.md).

## Correrlo

```bash
pnpm install
pnpm dev
```

Abre en http://localhost:3000. Sin configurar nada usa una base Postgres embebida en `.data/` (se crea y migra sola), cargada con datos de ejemplo.

Las cuentas de ejemplo y su contraseña están en [src/lib/db/seed.ts](src/lib/db/seed.ts). Para arrancar sin datos de ejemplo: `SEED_DEMO=0 pnpm dev`. Para empezar de cero, borrá `.data/`.

## Configuración

En local alcanza con `.env.local` (copiar de `.env.example`). En producción las variables viven en Vercel, nunca en el repositorio.

| Variable | Para qué |
|---|---|
| `BETTER_AUTH_SECRET` | Firma de sesiones. Obligatoria en producción. |
| `DATABASE_URL` o `POSTGRES_URL` | Postgres. `POSTGRES_URL` la carga sola la integración de Supabase en Vercel. Sin ninguna, en desarrollo se usa la base embebida. |
| `POSTGRES_URL_NON_POOLING` | Conexión directa para las migraciones (la carga la integración). |
| `DATABASE_SSL` · `DATABASE_CA_CERT` | Cifrado de la conexión a la base: por defecto verifica el certificado; ver `src/lib/db/index.ts`. |
| `APP_URL` | URL pública, si se usa un dominio propio. |
| `ALLOW_INDEXING` | `1` para dejar que los buscadores indexen el sitio. Sin esto va con `noindex`. |

## Trabajar de a dos

- `main` es producción: cada commit que entra a `main` se publica solo en Vercel (antes corren las migraciones de la base).
- Para un cambio: rama nueva → push → pull request. GitHub corre tipos, lint, tests y auditoría de dependencias, y Vercel arma una vista previa.
- Las vistas previas usan la misma base que producción y no aplican migraciones: un cambio de esquema se prueba en local antes de integrarlo.

## Seguridad

- **Autenticación:** Better Auth con usuarios en nuestra base. Contraseñas de 10+ caracteres, rechazadas si figuran en filtraciones conocidas, guardadas con hash scrypt. Cookies `HttpOnly`, `Secure`, `SameSite=Lax`. No hay endpoints de autenticación fuera de los formularios.
- **Límite de intentos:** ingreso (por IP y por cuenta), registro y acciones que se prestan a abuso. Contadores en Postgres (`src/lib/security`).
- **XSS:** React escapa todo; Content-Security-Policy con nonce por request (`src/proxy.ts`); los links cargados por usuarios solo pueden ser `http/https`.
- **Inyección SQL:** todas las consultas van parametrizadas por Drizzle.
- **CSRF y clickjacking:** las Server Actions verifican origen; `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (`next.config.ts`).
- **Autorización:** cada acción y cada página verifican sesión, rol y pertenencia al recurso en el servidor.
- **Base:** conexión cifrada; Row Level Security en todas las tablas para que la API pública de Supabase no exponga datos.
- **Pendiente:** verificación de email y recuperación de contraseña (necesitan un servicio de envío de mails).

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm test` | Tests de reglas de pago, liquidaciones y métricas |
| `pnpm typecheck` / `pnpm lint` | Chequeos estáticos |
| `pnpm db:generate` | Genera una migración a partir de cambios en `src/lib/db/schema.ts` |
| `pnpm db:migrate` | Aplica migraciones a `DATABASE_URL` |

## Dónde está cada cosa

| Carpeta | Contenido |
|---|---|
| `src/lib/payrules` | Motor de reglas de pago (puro) |
| `src/lib/ledger` | `service.ts`: cálculo de liquidaciones y registro de "pagado" / "cobro confirmado". También guarda, sin uso hoy, el libro contable para cuando los pagos pasen por la plataforma |
| `src/lib/stats` | Métricas de perfil y de equipo, derivadas de los videos |
| `src/lib/payments` · `src/lib/payouts` | Adaptadores de cobro y de retiros. Sin uso hoy |
| `src/lib/security` · `src/proxy.ts` | Límite de intentos, encabezados de seguridad y Content-Security-Policy |
| `src/lib/actions` | Server Actions: toda mutación pasa por acá y valida sesión y pertenencia |
| `src/lib/queries.ts` | Lecturas para las pantallas |
| `src/components/ui` · `shell` · `domain` | Sistema visual |
| `src/app/(public)` | Landing, bolsa de trabajos, talento, perfiles, registro |
| `src/app/app` | Panel del contratador y del trabajador |

## Cuando los pagos pasen por la plataforma

Hoy `platform_settings.payments_mode` es `external`: sin comisión, sin saldo, sin retiros. El modelo de datos y la lógica para cobrar dentro de la plataforma ya existen y están testeados (libro contable, comisión en `splitPayout`, depósitos por `PaymentProvider`, retiros por `PayoutProvider`); falta volver a construir sus pantallas. Ver DESIGN.md.
