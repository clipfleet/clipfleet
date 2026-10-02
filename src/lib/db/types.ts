import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
/** Cualquier cosa que pueda ejecutar queries: la base o una transacción abierta. */
export type Executor = Db | Tx;
