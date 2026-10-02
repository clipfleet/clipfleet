import { eq } from "drizzle-orm";
import type { Executor } from "@/lib/db/types";
import { platformSettings } from "@/lib/db/schema";

export type PlatformSettings = typeof platformSettings.$inferSelect;

/** Configuración monetaria de la plataforma. Se crea con los valores por defecto la primera vez. */
export async function getSettings(db: Executor): Promise<PlatformSettings> {
  const [existing] = await db.select().from(platformSettings).where(eq(platformSettings.id, "default"));
  if (existing) return existing;
  await db.insert(platformSettings).values({ id: "default" }).onConflictDoNothing();
  const [created] = await db.select().from(platformSettings).where(eq(platformSettings.id, "default"));
  return created;
}

export async function updateSettings(
  db: Executor,
  patch: Partial<Pick<PlatformSettings, "feeBps" | "feePayer" | "withdrawalMode" | "minWithdrawal">>,
): Promise<void> {
  await getSettings(db);
  await db
    .update(platformSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(platformSettings.id, "default"));
}
