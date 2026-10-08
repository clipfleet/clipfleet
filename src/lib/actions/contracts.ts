"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { contracts, deliverables, messages, reviews, viewSnapshots } from "@/lib/db/schema";
import { parseCount } from "@/lib/format";
import { tooMany } from "@/lib/security/limits";
import { requireUser, type SessionUser } from "@/lib/session";
import { jobPlatformLabel, type JobPlatform } from "@/lib/domain/categories";
import { detectPlatform } from "@/lib/views";
import { httpUrl, text, type ActionResult } from "./result";

/** La contratación, solo si el usuario es una de las dos partes. */
async function contractFor(me: SessionUser, contractId: string) {
  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, contractId), or(eq(contracts.hirerId, me.id), eq(contracts.workerId, me.id))));
  return contract ?? null;
}

/** La entrega junto con su contratación, solo si el usuario es una de las dos partes. */
async function deliverableFor(me: SessionUser, deliverableId: string) {
  const [row] = await db
    .select({ deliverable: deliverables, contract: contracts })
    .from(deliverables)
    .innerJoin(contracts, eq(contracts.id, deliverables.contractId))
    .where(and(eq(deliverables.id, deliverableId), or(eq(contracts.hirerId, me.id), eq(contracts.workerId, me.id))));
  return row ?? null;
}

function refresh(contractId: string) {
  revalidatePath(`/app/equipo/${contractId}`);
  revalidatePath(`/app/contrataciones/${contractId}`);
  revalidatePath("/app", "layout");
}

/** El contratador pide una entrega con fecha (un encargo). */
export async function requestDeliverable(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const contract = await contractFor(me, text(form, "contractId"));
  if (!contract || contract.status !== "active") return { error: "La contratación no está activa." };
  const title = text(form, "title", 160);
  const dueAt = new Date(`${text(form, "dueAt")}T23:59:59-03:00`);
  if (title.length < 3) return { error: "Describí qué necesitás." };
  if (Number.isNaN(dueAt.getTime())) return { error: "Elegí una fecha de entrega." };
  await db.insert(deliverables).values({
    contractId: contract.id,
    title,
    kind: form.get("kind") === "post" ? "post" : "file",
    dueAt,
    status: "requested",
  });
  refresh(contract.id);
}

/** La regla de pago vale para las vistas de una plataforma: un video de otra no entra en la contratación. */
function platformMismatch(contract: { platform: JobPlatform | null; platformName: string | null }, url: string): ActionResult {
  const { platform, platformName } = contract;
  if (!platform || detectPlatform(url) === platform) return undefined;
  return { error: `Esta contratación es para ${jobPlatformLabel(platform, platformName)}. Pega el link de un video publicado ahí.` };
}

/** El trabajador registra una entrega: una nueva, o la respuesta a un encargo. */
export async function submitDeliverable(form: FormData): Promise<ActionResult> {
  const me = await requireUser("worker");
  const limited = await tooMany("submitDeliverable", me.id);
  if (limited) return limited;
  const url = httpUrl(text(form, "url", 2000));
  if (!url) return { error: "Pegá el link completo (tiene que empezar con https://)." };
  const accountHandle = text(form, "accountHandle", 80) || null;
  const deliverableId = text(form, "deliverableId");

  if (deliverableId) {
    const row = await deliverableFor(me, deliverableId);
    if (!row || row.contract.workerId !== me.id) return { error: "Encargo inexistente." };
    if (row.deliverable.status !== "requested") return { error: "Este encargo ya fue entregado." };
    const wrongPlatform = platformMismatch(row.contract, url);
    if (wrongPlatform) return wrongPlatform;
    await db
      .update(deliverables)
      .set({ url, platform: detectPlatform(url), accountHandle, submittedAt: new Date(), status: "submitted" })
      .where(eq(deliverables.id, deliverableId));
    refresh(row.contract.id);
    return;
  }

  const contract = await contractFor(me, text(form, "contractId"));
  if (!contract || contract.workerId !== me.id || contract.status !== "active") {
    return { error: "La contratación no está activa." };
  }
  const wrongPlatform = platformMismatch(contract, url);
  if (wrongPlatform) return wrongPlatform;
  await db.insert(deliverables).values({
    contractId: contract.id,
    title: text(form, "title", 160),
    kind: form.get("kind") === "file" ? "file" : "post",
    url,
    platform: detectPlatform(url),
    accountHandle,
    submittedAt: new Date(),
    status: "submitted",
  });
  refresh(contract.id);
}

/** El contratador aprueba o rechaza una entrega. */
export async function reviewDeliverable(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const row = await deliverableFor(me, text(form, "deliverableId"));
  if (!row) return { error: "Entrega inexistente." };
  if (row.deliverable.status !== "submitted") return { error: "Esta entrega ya fue revisada." };

  if (form.get("decision") === "rejected") {
    await db
      .update(deliverables)
      .set({ status: "rejected", reviewedAt: new Date() })
      .where(eq(deliverables.id, row.deliverable.id));
  } else {
    // El puntaje de calidad es opcional: hoy la interfaz aprueba con un clic y no lo pide.
    const rating = form.has("qualityRating") ? parseCount(form.get("qualityRating")) : null;
    if (rating !== null && (rating < 1 || rating > 5)) return { error: "La calidad va del 1 al 5." };
    await db
      .update(deliverables)
      .set({ status: "approved", qualityRating: rating, reviewedAt: new Date() })
      .where(eq(deliverables.id, row.deliverable.id));
  }
  refresh(row.contract.id);
}

/** El trabajador reporta vistas con evidencia; quedan pendientes hasta que el contratador las aprueba. */
export async function reportViews(form: FormData): Promise<ActionResult> {
  const me = await requireUser("worker");
  const limited = await tooMany("reportViews", me.id);
  if (limited) return limited;
  const row = await deliverableFor(me, text(form, "deliverableId"));
  if (!row || row.contract.workerId !== me.id) return { error: "Entrega inexistente." };
  if (row.deliverable.status !== "approved" && row.deliverable.status !== "submitted") {
    return { error: "Solo se reportan vistas de entregas publicadas." };
  }
  const views = parseCount(form.get("views"));
  if (views === null) return { error: "Indicá la cantidad de vistas." };
  if (views <= row.deliverable.views) {
    return { error: "Las vistas reportadas tienen que superar las ya aprobadas." };
  }

  // Un solo reporte pendiente por entrega: el nuevo reemplaza al anterior.
  await db.transaction(async (tx) => {
    await tx
      .update(viewSnapshots)
      .set({ status: "rejected", decidedAt: new Date() })
      .where(and(eq(viewSnapshots.deliverableId, row.deliverable.id), eq(viewSnapshots.status, "pending")));
    await tx.insert(viewSnapshots).values({ deliverableId: row.deliverable.id, views });
  });
  refresh(row.contract.id);
}

/** El contratador aprueba o rechaza un reporte de vistas. */
export async function decideViews(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const [row] = await db
    .select({ snapshot: viewSnapshots, deliverable: deliverables, contract: contracts })
    .from(viewSnapshots)
    .innerJoin(deliverables, eq(deliverables.id, viewSnapshots.deliverableId))
    .innerJoin(contracts, eq(contracts.id, deliverables.contractId))
    .where(and(eq(viewSnapshots.id, text(form, "snapshotId")), eq(contracts.hirerId, me.id)));
  if (!row) return { error: "Reporte inexistente." };
  if (row.snapshot.status !== "pending") return { error: "Este reporte ya fue respondido." };

  const approved = form.get("decision") !== "rejected";
  await db.transaction(async (tx) => {
    await tx
      .update(viewSnapshots)
      .set({ status: approved ? "approved" : "rejected", decidedAt: new Date() })
      .where(eq(viewSnapshots.id, row.snapshot.id));
    if (approved) {
      await tx.update(deliverables).set({ views: row.snapshot.views }).where(eq(deliverables.id, row.deliverable.id));
    }
  });
  refresh(row.contract.id);
}

/** El contratador carga las vistas que verificó él mismo abriendo el video. */
export async function setViews(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const row = await deliverableFor(me, text(form, "deliverableId"));
  if (!row || row.contract.hirerId !== me.id) return { error: "Entrega inexistente." };
  const views = parseCount(form.get("views"));
  if (views === null) return { error: "Indicá la cantidad de vistas." };
  await db.transaction(async (tx) => {
    await tx.insert(viewSnapshots).values({
      deliverableId: row.deliverable.id,
      views,
      status: "approved",
      decidedAt: new Date(),
    });
    await tx.update(deliverables).set({ views }).where(eq(deliverables.id, row.deliverable.id));
  });
  refresh(row.contract.id);
}

export async function sendMessage(form: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const limited = await tooMany("sendMessage", me.id);
  if (limited) return limited;
  const contract = await contractFor(me, text(form, "contractId"));
  if (!contract) return { error: "Contratación inexistente." };
  const body = text(form, "body", 2000);
  if (!body) return { error: "Escribí un mensaje." };
  await db.insert(messages).values({ contractId: contract.id, authorId: me.id, body });
  refresh(contract.id);
}

export async function endContract(form: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const contract = await contractFor(me, text(form, "contractId"));
  if (!contract) return { error: "Contratación inexistente." };
  if (contract.status === "ended") return { error: "La contratación ya estaba finalizada." };
  await db.update(contracts).set({ status: "ended", endedAt: new Date() }).where(eq(contracts.id, contract.id));
  refresh(contract.id);
}

/** Reseña de una parte a la otra, una vez finalizada la contratación. */
export async function leaveReview(form: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const limited = await tooMany("leaveReview", me.id);
  if (limited) return limited;
  const contract = await contractFor(me, text(form, "contractId"));
  if (!contract) return { error: "Contratación inexistente." };
  if (contract.status !== "ended") return { error: "Las reseñas se dejan al finalizar la contratación." };
  const rating = parseCount(form.get("rating"));
  if (!rating || rating < 1 || rating > 5) return { error: "Elegí un puntaje del 1 al 5." };
  const inserted = await db
    .insert(reviews)
    .values({
      contractId: contract.id,
      authorId: me.id,
      targetId: me.id === contract.hirerId ? contract.workerId : contract.hirerId,
      rating,
      comment: text(form, "comment", 1000),
    })
    .onConflictDoNothing()
    .returning({ id: reviews.id });
  if (inserted.length === 0) return { error: "Ya dejaste tu reseña para esta contratación." };
  refresh(contract.id);
  revalidatePath("/t", "layout");
}
