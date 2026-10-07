import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { Pool, type PoolConfig } from "pg";
import * as schema from "./schema";
import { SUPABASE_ROOT_CA } from "./supabase-ca";
import type { Db } from "./types";

export type { Db, Executor, Tx } from "./types";

const migrationsFolder = path.join(process.cwd(), "drizzle");

type Connection = { db: Db; embedded: boolean; ready: Promise<void>; migrate: () => Promise<void> };

/** URL de conexión: la propia, o la que carga la integración de Supabase en Vercel. */
function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

/**
 * Conexión siempre cifrada fuera de la máquina local, verificando el certificado del servidor:
 * contra la raíz fijada de Supabase si el host es de Supabase, contra `DATABASE_CA_CERT` (PEM)
 * si se define, o contra las raíces públicas del sistema. `DATABASE_SSL=require` cifra sin
 * verificar y existe solo como salida de emergencia.
 */
function poolConfig(rawUrl: string): PoolConfig {
  const url = new URL(rawUrl);
  // `pg` deja que el `sslmode` de la URL pise la configuración explícita: se quita y se decide acá.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("supa");
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const mode = process.env.DATABASE_SSL ?? (local ? "disable" : "verify");
  const supabase = /\.supabase\.(com|co)$/.test(url.hostname);
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n") ?? (supabase ? SUPABASE_ROOT_CA : undefined);
  const ssl = mode === "disable" ? false : mode === "require" ? { rejectUnauthorized: false } : { rejectUnauthorized: true, ...(ca ? { ca } : {}) };
  return { connectionString: url.toString(), ssl, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 };
}

/**
 * Con una URL de conexión usa Postgres; sin ella, un Postgres embebido (PGlite) en `.data/`
 * para poder desarrollar sin instalar nada. El esquema y las queries son los mismos.
 */
function connect(): Connection {
  const url = databaseUrl();
  if (url) {
    const pgDb = drizzlePg(new Pool(poolConfig(url)), { schema });
    return {
      db: pgDb as unknown as Db,
      embedded: false,
      ready: Promise.resolve(),
      migrate: () => migratePg(pgDb, { migrationsFolder }),
    };
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_EMBEDDED_DB !== "1") {
    throw new Error("Falta la URL de la base (DATABASE_URL o POSTGRES_URL): la base embebida es solo para desarrollo.");
  }
  const dir = path.join(process.cwd(), ".data", "pglite");
  mkdirSync(path.dirname(dir), { recursive: true });
  const client = new PGlite(dir);
  closeOnExit(client);
  const embeddedDb = drizzlePglite(client, { schema });
  const ready = migratePglite(embeddedDb, { migrationsFolder }).catch((error) => {
    throw new Error(
      "No se pudo abrir la base embebida de desarrollo (.data/pglite). Suele pasar si el servidor se cortó " +
        "de golpe mientras escribía. Son datos de ejemplo: borrá la carpeta .data y volvé a arrancar.",
      { cause: error },
    );
  });
  return { db: embeddedDb as unknown as Db, embedded: true, ready, migrate: () => ready };
}

/**
 * La base embebida se corrompe si el proceso muere sin cerrarla. Al recibir la señal de
 * corte se cierra antes de salir; no cubre un kill -9.
 */
function closeOnExit(client: PGlite) {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      client
        .close()
        .catch(() => {})
        .finally(() => process.exit(0));
    });
  }
}

// Una sola conexión por proceso, también con el hot reload de desarrollo. Se abre recién
// en el primer uso, para que importar este módulo (p. ej. durante `next build`) no conecte.
const globalRef = globalThis as unknown as { __appDb?: Connection };
function connection(): Connection {
  return (globalRef.__appDb ??= connect());
}

export const db = new Proxy({} as Db, {
  get(_target, property) {
    const real = connection().db;
    const value = Reflect.get(real, property);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

/** La conexión real, sin el envoltorio perezoso. Para librerías que inspeccionan el objeto (el adaptador de auth). */
export function getDb(): Db {
  return connection().db;
}

export function isEmbeddedDb(): boolean {
  return connection().embedded;
}

/** Resuelve cuando la base está lista para usarse (la embebida aplica migraciones al arrancar). */
export function dbReady(): Promise<void> {
  return connection().ready;
}

/** Para Postgres real: `pnpm db:migrate`. */
export function runMigrations(): Promise<void> {
  return connection().migrate();
}
