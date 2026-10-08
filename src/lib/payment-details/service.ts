import { and, desc, eq, isNotNull } from "drizzle-orm";
import { contracts, paymentDetails, payouts } from "@/lib/db/schema";
import type { Executor } from "@/lib/db/types";
import type { AccountKind } from "./index";

export type PaymentDetails = typeof paymentDetails.$inferSelect;

export async function getPaymentDetails(db: Executor, userId: string): Promise<PaymentDetails | null> {
  const [row] = await db.select().from(paymentDetails).where(eq(paymentDetails.userId, userId));
  return row ?? null;
}

/** Datos de cobro del gestor: titular y cuenta. */
export async function savePayeeDetails(
  db: Executor,
  userId: string,
  values: { holderName: string; account: string; accountKind: AccountKind },
): Promise<void> {
  const row = { ...values, updatedAt: new Date() };
  await db
    .insert(paymentDetails)
    .values({ userId, ...row })
    .onConflictDoUpdate({ target: paymentDetails.userId, set: row });
}

/** Titular de la cuenta desde la que paga el contratador. */
export async function savePayerHolder(db: Executor, userId: string, holderName: string): Promise<void> {
  const row = { holderName, updatedAt: new Date() };
  await db
    .insert(paymentDetails)
    .values({ userId, ...row })
    .onConflictDoUpdate({ target: paymentDetails.userId, set: row });
}

export type PayeeView = {
  holderName: string;
  account: string;
  accountKind: AccountKind;
  /** La cuenta no es la misma a la que este contratador le pagó la última vez. */
  changedSinceLastPayment: boolean;
};

/**
 * A dónde tiene que transferir un contratador para pagarle a un gestor. Solo debe llamarse
 * para las dos partes de una contratación: quien llama ya verificó la pertenencia.
 */
export async function payeeFor(db: Executor, hirerId: string, workerId: string): Promise<PayeeView | null> {
  const details = await getPaymentDetails(db, workerId);
  if (!details?.account || !details.accountKind) return null;

  const [lastPaid] = await db
    .select({ account: payouts.paidToAccount })
    .from(payouts)
    .innerJoin(contracts, eq(contracts.id, payouts.contractId))
    .where(
      and(
        eq(contracts.hirerId, hirerId),
        eq(contracts.workerId, workerId),
        eq(payouts.status, "released"),
        isNotNull(payouts.paidToAccount),
      ),
    )
    .orderBy(desc(payouts.releasedAt))
    .limit(1);

  return {
    holderName: details.holderName,
    account: details.account,
    accountKind: details.accountKind,
    changedSinceLastPayment: lastPaid !== undefined && lastPaid.account !== details.account,
  };
}
