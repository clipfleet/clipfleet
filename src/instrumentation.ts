/** Al arrancar el servidor: prepara la base embebida de desarrollo y la carga con datos de ejemplo. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { db, dbReady, isEmbeddedDb } = await import("@/lib/db");
  await dbReady();
  if (isEmbeddedDb() && process.env.SEED_DEMO !== "0") {
    const { seedIfEmpty } = await import("@/lib/db/seed");
    await seedIfEmpty(db);
  }
}
