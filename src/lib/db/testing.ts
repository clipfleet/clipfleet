import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";
import type { Db } from "./types";

/** Base en memoria con el esquema aplicado, para tests. */
export async function createTestDb(): Promise<Db> {
  const testDb = drizzle(new PGlite(), { schema });
  await migrate(testDb, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return testDb as unknown as Db;
}
