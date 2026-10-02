// Aplica las migraciones pendientes. Corre en cada despliegue a producción (`vercel-build`)
// y a mano con `pnpm db:migrate`.

// Las vistas previas comparten la base con producción: no migran, para que una rama sin
// integrar no cambie el esquema de la base real.
if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") {
  console.log("Vista previa: no se aplican migraciones.");
  process.exit(0);
}

// Las migraciones van por la conexión directa, no por el pooler.
if (process.env.POSTGRES_URL_NON_POOLING && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING;
}

import("../src/lib/db")
  .then(({ runMigrations }) => runMigrations())
  .then(() => {
    console.log("Migraciones aplicadas.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
