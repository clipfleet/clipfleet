# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Clipfleet: marketplace y herramienta de gestión entre contratadores (creadores, marcas) y gestores de multicuentas. El producto está definido en [DESIGN.md](DESIGN.md) (la sección "Modelo vigente" manda sobre el resto del documento) y el sistema visual en [docs/design-system.md](docs/design-system.md). Los cambios que contradigan DESIGN.md se consultan antes de implementarse.

## Comandos

```bash
pnpm dev                     # http://localhost:3000, con base embebida y datos de ejemplo
SEED_DEMO=0 pnpm dev         # sin datos de ejemplo
pnpm test                    # vitest run (src/**/*.test.ts)
pnpm vitest run src/lib/payrules/index.test.ts   # un solo archivo
pnpm vitest run -t "nombre del test"             # un solo test
pnpm typecheck               # en CI corre antes `pnpm exec next typegen`
pnpm lint
pnpm db:generate             # migración a partir de cambios en src/lib/db/schema.ts
pnpm db:migrate              # aplica migraciones a DATABASE_URL / POSTGRES_URL_NON_POOLING
```

El CI (`.github/workflows/ci.yml`) corre `next typegen`, typecheck, lint, tests y `pnpm audit --prod --audit-level high`. Cada push a `main` se publica en producción en Vercel (migraciones incluidas), así que `main` es producción: los cambios van por rama y pull request. No hay vistas previas conectadas a una base, se prueba en local.

## Arquitectura

**Base de datos (`src/lib/db`).** Drizzle sobre Postgres. Sin `DATABASE_URL`/`POSTGRES_URL`, `src/lib/db/index.ts` abre un Postgres embebido (PGlite) en `.data/pglite`, le aplica las migraciones de `drizzle/` y `src/instrumentation.ts` lo carga con `seed.ts` (ahí están las cuentas de ejemplo). Si la base embebida se corrompe (proceso cortado de golpe), se borra `.data/`. `db` es un Proxy perezoso para no conectar durante `next build`; las librerías que inspeccionan el objeto (el adaptador de Better Auth) usan `getDb()`. En producción la base es Supabase, con RLS sin políticas en todas las tablas: una tabla nueva necesita habilitar RLS en su migración (ver `drizzle/0002_seguridad.sql`).

**Tests.** Los tests que tocan la base usan `createTestDb()` (`src/lib/db/testing.ts`): PGlite en memoria con las migraciones reales. Por eso las funciones de servicio reciben el `Db`/`Executor` como parámetro en lugar de importar `db`. La lógica pura (`payrules`, `ledger/core.ts`, `stats`) se testea sin base.

**Mutaciones y lecturas.** Toda mutación es una Server Action en `src/lib/actions/*` con el mismo patrón: `requireUser(rol)` (`src/lib/session.ts`) → `tooMany(acción, id)` (límites en `src/lib/security/limits.ts`, contadores en Postgres) → leer el `FormData` con `text()`/`parseCount()`/`parsePesos()` → validar → escribir filtrando por pertenencia (p. ej. `eq(jobs.hirerId, me.id)`) → `revalidatePath`/`redirect`. Devuelven `ActionResult` (`{ error }` | `{ ok }` | `undefined`), que consume `ActionForm` en `src/components/forms/action-form.tsx`. Las lecturas de las pantallas viven en `src/lib/queries.ts`. Las páginas también llaman a `requireUser`.

**Dinero.** Todos los montos son centavos enteros (ARS). Las reglas de pago (`src/lib/payrules`) son un fijo por entrega más un variable (`cpm` o `tiers`), validadas con zod; calculan la liquidación sobre las vistas aprobadas por el contratador. Hoy `platform_settings.payments_mode = external`: la plata no pasa por la plataforma, el contratador marca "pagado" y el trabajador confirma el cobro (`src/lib/ledger/service.ts`). El libro contable, la comisión (`splitPayout`, único lugar de esa regla), `src/lib/payments` y `src/lib/payouts` existen y están testeados pero no tienen pantallas; no hay que borrarlos.

**Vistas.** Las reporta el trabajador y las aprueba el contratador. `src/lib/views` define la interfaz `ViewSource` para una futura fuente automática; hoy no hay ninguna.

**Seguridad.** `src/proxy.ts` (el middleware de esta versión de Next) pone la Content-Security-Policy con nonce por request; el resto de los encabezados está en `next.config.ts` y `src/lib/security/headers.ts`. Los links cargados por usuarios pasan por `httpUrl()` al guardar y al mostrar; los `?next=` por `safeNext()`.

**Rutas.** `src/app/(public)` es lo público (landing, `/trabajos`, `/talento`, `/t/[username]`, registro e ingreso, invitaciones). `src/app/app` es el panel; `homeFor(rol)` decide adónde entra cada rol (`hirer` → `/app/equipo`, `worker` → `/app/contrataciones`). `/ui-kit` es la muestra viva del sistema de diseño, solo en desarrollo.

## Convenciones

- El nombre y los datos de marca salen de `BRAND` en `src/lib/brand.ts`; nunca se escriben a mano.
- Las pantallas siguen los presupuestos de [docs/design-system.md](docs/design-system.md) (una idea por pantalla, máximo 3 `Stat`, sin texto de ayuda que repita lo que la pantalla ya muestra). Se construyen con los primitivos de `src/components/ui` y `shell`/`domain`/`forms` antes de crear componentes nuevos.
- El sitio está en español: todos los textos de la interfaz (páginas, formularios, mensajes de error de las Server Actions, metadata) se escriben en español.
