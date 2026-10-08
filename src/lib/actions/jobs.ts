"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { applications, contracts, invites, jobs } from "@/lib/db/schema";
import { DEFAULT_CATEGORY, isJobPlatform } from "@/lib/domain/categories";
import { parseCount } from "@/lib/format";
import { payRuleFromForm } from "@/lib/payrules/form";
import { tooMany } from "@/lib/security/limits";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { text, type ActionResult } from "./result";

export async function createJob(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("createJob", me.id);
  if (limited) return limited;
  const title = text(form, "title", 120);
  const description = text(form, "description", 4000);
  const category = DEFAULT_CATEGORY;
  const slots = parseCount(form.get("slots")) ?? 1;
  if (title.length < 5) return { error: "Poné un título más descriptivo." };
  if (description.length < 20) return { error: "Contá un poco más sobre el trabajo." };
  if (slots < 1 || slots > 200) return { error: "La cantidad de puestos tiene que estar entre 1 y 200." };
  const platform = form.get("platform");
  if (!isJobPlatform(platform)) return { error: "Elige en qué plataforma se publican los videos." };
  const parsed = payRuleFromForm(form);
  if ("error" in parsed) return parsed;

  const [job] = await db
    .insert(jobs)
    .values({ hirerId: me.id, title, description, category, platform, slots, payRule: parsed.rule })
    .returning({ id: jobs.id });
  revalidatePath("/trabajos");
  redirect(`/app/busquedas/${job.id}`);
}

export async function setJobStatus(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const status = form.get("status");
  if (status !== "open" && status !== "paused" && status !== "closed") return { error: "Estado inválido." };
  await db
    .update(jobs)
    .set({ status })
    .where(and(eq(jobs.id, text(form, "jobId")), eq(jobs.hirerId, me.id)));
  revalidatePath("/app/busquedas", "layout");
  revalidatePath("/trabajos");
}

export async function applyToJob(form: FormData): Promise<ActionResult> {
  const me = await requireUser("worker");
  const limited = await tooMany("applyToJob", me.id);
  if (limited) return limited;
  const jobId = text(form, "jobId");
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job || job.status !== "open") return { error: "Esta búsqueda ya no recibe postulaciones." };
  const inserted = await db
    .insert(applications)
    .values({ jobId, workerId: me.id, message: text(form, "message", 2000) })
    .onConflictDoNothing()
    .returning({ id: applications.id });
  if (inserted.length === 0) return { error: "Ya te postulaste a esta búsqueda." };
  revalidatePath(`/trabajos/${jobId}`);
  return { ok: "Postulación enviada. Te avisamos en tu panel cuando el contratador responda." };
}

export async function decideApplication(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const decision = form.get("decision");
  if (decision !== "accepted" && decision !== "rejected") return { error: "Decisión inválida." };

  const error = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ application: applications, job: jobs })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(and(eq(applications.id, text(form, "applicationId")), eq(jobs.hirerId, me.id)))
      .for("update");
    if (!row) return "Postulación inexistente.";
    if (row.application.status !== "pending") return "Esta postulación ya fue respondida.";

    await tx.update(applications).set({ status: decision }).where(eq(applications.id, row.application.id));
    if (decision === "rejected") return null;

    const settings = await getSettings(tx);
    await tx.insert(contracts).values({
      jobId: row.job.id,
      hirerId: me.id,
      workerId: row.application.workerId,
      origin: "job",
      title: row.job.title,
      category: row.job.category,
      platform: row.job.platform,
      payRule: row.job.payRule,
      feeBps: settings.feeBps,
      feePayer: settings.feePayer,
    });
    const [{ hired }] = await tx.select({ hired: count() }).from(contracts).where(eq(contracts.jobId, row.job.id));
    if (hired >= row.job.slots) await tx.update(jobs).set({ status: "closed" }).where(eq(jobs.id, row.job.id));
    return null;
  });
  if (error) return { error };
  revalidatePath("/app", "layout");
  revalidatePath("/trabajos");
}

export async function createInvites(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("createInvites", me.id);
  if (limited) return limited;
  const title = text(form, "title", 120);
  const category = DEFAULT_CATEGORY;
  const quantity = parseCount(form.get("quantity")) ?? 1;
  if (title.length < 3) return { error: "Poné un nombre para este trabajo (ej. “Clips del canal”)." };
  if (quantity < 1 || quantity > 30) return { error: "Podés generar entre 1 y 30 links por vez." };
  const platform = form.get("platform");
  if (!isJobPlatform(platform)) return { error: "Elige en qué plataforma se publican los videos." };
  const parsed = payRuleFromForm(form);
  if ("error" in parsed) return parsed;

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  await db.insert(invites).values(
    Array.from({ length: quantity }, () => ({
      hirerId: me.id,
      token: randomBytes(18).toString("base64url"),
      title,
      category,
      platform,
      payRule: parsed.rule,
      expiresAt,
    })),
  );
  revalidatePath("/app/equipo/invitar");
  return { ok: quantity === 1 ? "Link generado. Cada link sirve para una persona." : `${quantity} links generados. Cada uno sirve para una persona.` };
}

export async function acceptInvite(form: FormData): Promise<ActionResult> {
  const me = await requireUser("worker");
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const token = text(form, "token");

  const result = await db.transaction(async (tx): Promise<{ error: string } | { contractId: string }> => {
    const [invite] = await tx.select().from(invites).where(eq(invites.token, token)).for("update");
    if (!invite) return { error: "Invitación inexistente." };
    if (invite.usedBy) return { error: "Esta invitación ya fue usada." };
    if (invite.expiresAt.getTime() < Date.now()) return { error: "Esta invitación venció. Pedile un link nuevo al contratador." };

    const settings = await getSettings(tx);
    const [contract] = await tx
      .insert(contracts)
      .values({
        hirerId: invite.hirerId,
        workerId: me.id,
        origin: "invite",
        title: invite.title,
        category: invite.category,
        platform: invite.platform,
        payRule: invite.payRule,
        feeBps: settings.feeBps,
        feePayer: settings.feePayer,
      })
      .returning({ id: contracts.id });
    await tx.update(invites).set({ usedBy: me.id, usedAt: new Date() }).where(eq(invites.id, invite.id));
    return { contractId: contract.id };
  });
  if ("error" in result) return result;
  revalidatePath("/app", "layout");
  redirect(`/app/contrataciones/${result.contractId}`);
}
