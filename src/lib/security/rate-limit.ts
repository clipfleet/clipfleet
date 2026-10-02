import { createHash } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import { rateLimits } from "@/lib/db/schema";
import type { Executor } from "@/lib/db/types";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

/** La clave se guarda como hash: la tabla no contiene IPs ni emails en claro. */
function hashKey(key: string): string {
  const pepper = process.env.BETTER_AUTH_SECRET ?? "";
  return createHash("sha256").update(`${pepper}:${key}`).digest("hex");
}

/**
 * Cuenta un intento y dice si entra en el límite: como mucho `limit` intentos cada
 * `windowSeconds`. Es una sola sentencia atómica, así que dos requests simultáneos no se
 * saltean el límite. Vive en Postgres para funcionar igual con varias instancias del servidor.
 */
export async function hit(
  db: Executor,
  key: string,
  limit: number,
  windowSeconds: number,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const nowIso = now.toISOString();
  const cutoffIso = new Date(now.getTime() - windowSeconds * 1000).toISOString();
  const expired = sql`"rate_limits"."window_start" < ${cutoffIso}::timestamptz`;

  const [row] = await db
    .insert(rateLimits)
    .values({ key: hashKey(key), count: 1, windowStart: now })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${expired} then 1 else "rate_limits"."count" + 1 end`,
        windowStart: sql`case when ${expired} then ${nowIso}::timestamptz else "rate_limits"."window_start" end`,
      },
    })
    .returning();

  // De vez en cuando se barren los contadores viejos para que la tabla no crezca sin fin.
  if (Math.random() < 0.01) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(now.getTime() - 24 * 60 * 60 * 1000)));
  }

  if (row.count <= limit) return { allowed: true, retryAfterSeconds: 0 };
  const elapsed = (now.getTime() - row.windowStart.getTime()) / 1000;
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(windowSeconds - elapsed)) };
}
