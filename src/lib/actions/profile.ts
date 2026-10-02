"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hirerProfiles, user, workerProfiles } from "@/lib/db/schema";
import { DEFAULT_CATEGORY } from "@/lib/domain/categories";
import { tooMany } from "@/lib/security/limits";
import { requireUser } from "@/lib/session";
import { httpUrl, text, type ActionResult } from "./result";

function links(form: FormData, name: string): string[] {
  return text(form, name, 2000)
    .split(/\s+/)
    .flatMap((value) => httpUrl(value) ?? [])
    .slice(0, 8);
}

export async function updateWorkerProfile(form: FormData): Promise<ActionResult> {
  const me = await requireUser("worker");
  const limited = await tooMany("updateProfile", me.id);
  if (limited) return limited;
  const name = text(form, "name", 80);
  if (name.length < 2) return { error: "Decinos tu nombre." };
  // Solo se pisa lo que el formulario envía: un campo que no está en pantalla conserva su valor.
  const values = {
    headline: text(form, "headline", 120),
    categories: [DEFAULT_CATEGORY],
    ...(form.has("bio") ? { bio: text(form, "bio", 2000) } : {}),
    ...(form.has("portfolioLinks") ? { portfolioLinks: links(form, "portfolioLinks") } : {}),
    ...(form.has("country") ? { country: text(form, "country", 60) || "Argentina" } : {}),
  };
  await db.update(user).set({ name }).where(eq(user.id, me.id));
  await db
    .insert(workerProfiles)
    .values({ userId: me.id, ...values })
    .onConflictDoUpdate({ target: workerProfiles.userId, set: values });
  revalidatePath(`/t/${me.username}`);
  revalidatePath("/talento");
  return { ok: "Perfil guardado." };
}

export async function updateHirerProfile(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("updateProfile", me.id);
  if (limited) return limited;
  const name = text(form, "name", 80);
  const brandName = text(form, "brandName", 80);
  if (name.length < 2) return { error: "Decinos tu nombre." };
  if (brandName.length < 2) return { error: "Poné el nombre de tu canal o marca." };
  const values = {
    brandName,
    ...(form.has("description") ? { description: text(form, "description", 2000) } : {}),
    ...(form.has("channels") ? { channels: links(form, "channels") } : {}),
  };
  await db.update(user).set({ name }).where(eq(user.id, me.id));
  await db
    .insert(hirerProfiles)
    .values({ userId: me.id, ...values })
    .onConflictDoUpdate({ target: hirerProfiles.userId, set: values });
  revalidatePath("/trabajos");
  return { ok: "Perfil guardado." };
}
