"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { contracts, payouts } from "@/lib/db/schema";
import { confirmPayoutReceived, generatePayout, markPayoutPaid } from "@/lib/ledger/service";
import { tooMany } from "@/lib/security/limits";
import { requireUser } from "@/lib/session";
import { text, type ActionResult } from "./result";

// Los pagos se hacen por fuera de la plataforma, entre las partes. Acá solo se calcula
// cuánto corresponde y se deja constancia de que se pagó y de que se cobró.

/** Calcula lo adeudado en todas las contrataciones del contratador (o en una sola). */
export async function generatePayouts(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const contractId = text(form, "contractId");
  const mine = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(contractId ? and(eq(contracts.hirerId, me.id), eq(contracts.id, contractId)) : eq(contracts.hirerId, me.id));

  let generated = 0;
  for (const contract of mine) {
    if (await generatePayout(db, contract.id)) generated++;
  }
  revalidatePath("/app", "layout");
  if (generated === 0) return { ok: "No hay nada para liquidar: ningún video aprobado generó pago nuevo." };
  redirect("/app/liquidaciones");
}

/** El contratador informa que ya le pagó a la persona, por fuera de la plataforma. */
export async function markPayoutPaidAction(form: FormData): Promise<ActionResult> {
  const me = await requireUser("hirer");
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const [row] = await db
    .select({ id: payouts.id })
    .from(payouts)
    .innerJoin(contracts, eq(contracts.id, payouts.contractId))
    .where(and(eq(payouts.id, text(form, "payoutId")), eq(contracts.hirerId, me.id)));
  if (!row) return { error: "Liquidación inexistente." };
  await markPayoutPaid(db, row.id);
  revalidatePath("/app", "layout");
}

/** El trabajador confirma que recibió el pago. */
export async function confirmPayoutAction(form: FormData): Promise<ActionResult> {
  const me = await requireUser("worker");
  const limited = await tooMany("manage", me.id);
  if (limited) return limited;
  const [row] = await db
    .select({ id: payouts.id })
    .from(payouts)
    .innerJoin(contracts, eq(contracts.id, payouts.contractId))
    .where(and(eq(payouts.id, text(form, "payoutId")), eq(contracts.workerId, me.id)));
  if (!row) return { error: "Pago inexistente." };
  await confirmPayoutReceived(db, row.id);
  revalidatePath("/app", "layout");
}
