import { and, eq, isNull, sql } from "drizzle-orm";
import {
  contracts,
  deliverables,
  deposits,
  ledgerAccounts,
  ledgerEntries,
  payoutItems,
  payouts,
  withdrawals,
} from "@/lib/db/schema";
import type { Db, Executor, Tx } from "@/lib/db/types";
import { computePayout } from "@/lib/payrules";
import { getSettings } from "@/lib/settings";
import { buildReleaseEntries, InsufficientFundsError, splitPayout } from "./core";

type AccountKind = "hirer" | "worker" | "platform_fees";

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerError";
  }
}

async function findAccount(db: Executor, ownerId: string | null, kind: AccountKind) {
  const owner = ownerId === null ? isNull(ledgerAccounts.ownerId) : eq(ledgerAccounts.ownerId, ownerId);
  const [found] = await db
    .select()
    .from(ledgerAccounts)
    .where(and(owner, eq(ledgerAccounts.kind, kind)));
  return found;
}

export async function getOrCreateAccount(db: Executor, ownerId: string | null, kind: AccountKind) {
  const existing = await findAccount(db, ownerId, kind);
  if (existing) return existing;
  const { currency } = await getSettings(db);
  await db.insert(ledgerAccounts).values({ ownerId, kind, currency }).onConflictDoNothing();
  return (await findAccount(db, ownerId, kind))!;
}

/** Bloquea la cuenta dentro de la transacción para que dos movimientos no lean el mismo saldo. */
async function lockAccount(tx: Tx, accountId: string) {
  await tx.select({ id: ledgerAccounts.id }).from(ledgerAccounts).where(eq(ledgerAccounts.id, accountId)).for("update");
}

async function accountBalance(db: Executor, accountId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${ledgerEntries.amount}), 0)` })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.accountId, accountId));
  return Number(row.total);
}

export async function getBalance(db: Executor, ownerId: string | null, kind: AccountKind): Promise<number> {
  const account = await findAccount(db, ownerId, kind);
  return account ? accountBalance(db, account.id) : 0;
}

/** Lo ya comprometido en liquidaciones pendientes de liberar. */
export async function getReservedByHirer(db: Executor, hirerId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${payouts.hirerDebit}), 0)` })
    .from(payouts)
    .innerJoin(contracts, eq(contracts.id, payouts.contractId))
    .where(and(eq(contracts.hirerId, hirerId), eq(payouts.status, "pending")));
  return Number(row.total);
}

// --- Depósitos ---

/** Acredita un depósito confirmado por el proveedor. Idempotente: el webhook puede llegar varias veces. */
export async function confirmDeposit(db: Db, depositId: string, providerRef?: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [deposit] = await tx.select().from(deposits).where(eq(deposits.id, depositId)).for("update");
    if (!deposit) throw new LedgerError("Depósito inexistente");
    if (deposit.status === "confirmed") return;
    const account = await getOrCreateAccount(tx, deposit.hirerId, "hirer");
    await tx
      .insert(ledgerEntries)
      .values({ accountId: account.id, amount: deposit.amount, type: "deposit", depositId })
      .onConflictDoNothing();
    await tx
      .update(deposits)
      .set({ status: "confirmed", confirmedAt: new Date(), providerRef: providerRef ?? deposit.providerRef })
      .where(eq(deposits.id, depositId));
  });
}

// --- Liquidaciones ---

/**
 * Calcula lo adeudado de una contratación con las vistas aprobadas a hoy y lo deja como
 * liquidación pendiente. Si ya había una pendiente, la reemplaza. Devuelve null si no hay nada que pagar.
 */
export async function generatePayout(db: Db, contractId: string, now: Date = new Date()): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [contract] = await tx.select().from(contracts).where(eq(contracts.id, contractId)).for("update");
    if (!contract) throw new LedgerError("Contratación inexistente");

    await tx.delete(payouts).where(and(eq(payouts.contractId, contractId), eq(payouts.status, "pending")));

    const approved = await tx
      .select({ id: deliverables.id, views: deliverables.views })
      .from(deliverables)
      .where(and(eq(deliverables.contractId, contractId), eq(deliverables.status, "approved")));

    const paidRows = await tx
      .select({ deliverableId: payoutItems.deliverableId, total: sql<string>`sum(${payoutItems.amount})` })
      .from(payoutItems)
      .innerJoin(payouts, eq(payouts.id, payoutItems.payoutId))
      .where(and(eq(payouts.contractId, contractId), eq(payouts.status, "released")))
      .groupBy(payoutItems.deliverableId);
    const alreadyPaid = new Map(paidRows.map((row) => [row.deliverableId, Number(row.total)]));

    const result = computePayout(
      contract.payRule,
      approved.map((d) => ({ id: d.id, views: d.views, alreadyPaid: alreadyPaid.get(d.id) ?? 0 })),
    );
    if (result.amount === 0) return null;

    const [lastReleased] = await tx
      .select({ periodEnd: payouts.periodEnd })
      .from(payouts)
      .where(and(eq(payouts.contractId, contractId), eq(payouts.status, "released")))
      .orderBy(sql`${payouts.periodEnd} desc`)
      .limit(1);

    const split = splitPayout({ amount: result.amount, feeBps: contract.feeBps, feePayer: contract.feePayer });
    const [payout] = await tx
      .insert(payouts)
      .values({
        contractId,
        periodStart: lastReleased?.periodEnd ?? contract.startedAt,
        periodEnd: now,
        amount: result.amount,
        fee: split.fee,
        hirerDebit: split.hirerDebit,
        workerCredit: split.workerCredit,
      })
      .returning({ id: payouts.id });

    await tx.insert(payoutItems).values(
      result.breakdown
        .filter((line) => line.amount > 0)
        .map((line) => ({
          payoutId: payout.id,
          deliverableId: line.deliverableId,
          views: line.views,
          amount: line.amount,
          reason: line.reason,
        })),
    );
    return payout.id;
  });
}

/**
 * Libera una liquidación: debita al contratador, acredita al trabajador y cobra la comisión.
 * Atómico, e idempotente por `payoutId`: liberar dos veces no mueve plata dos veces.
 */
export async function releasePayout(db: Db, payoutId: string, now: Date = new Date()): Promise<void> {
  await db.transaction(async (tx) => {
    const [payout] = await tx.select().from(payouts).where(eq(payouts.id, payoutId)).for("update");
    if (!payout) throw new LedgerError("Liquidación inexistente");
    if (payout.status === "released") return;

    const [contract] = await tx.select().from(contracts).where(eq(contracts.id, payout.contractId));
    const hirerAccount = await getOrCreateAccount(tx, contract.hirerId, "hirer");
    const workerAccount = await getOrCreateAccount(tx, contract.workerId, "worker");
    const feeAccount = await getOrCreateAccount(tx, null, "platform_fees");

    await lockAccount(tx, hirerAccount.id);
    const available = await accountBalance(tx, hirerAccount.id);
    if (available < payout.hirerDebit) throw new InsufficientFundsError(available, payout.hirerDebit);

    const entries = buildReleaseEntries({
      hirerAccountId: hirerAccount.id,
      workerAccountId: workerAccount.id,
      feeAccountId: feeAccount.id,
      split: { fee: payout.fee, hirerDebit: payout.hirerDebit, workerCredit: payout.workerCredit },
    });
    await tx.insert(ledgerEntries).values(entries.map((entry) => ({ ...entry, payoutId })));
    await tx
      .update(payouts)
      .set({ status: "released", settlement: "ledger", releasedAt: now, confirmedAt: now })
      .where(eq(payouts.id, payoutId));
  });
}

/**
 * Pagos por fuera de la plataforma: el contratador informa que pagó. No mueve saldo;
 * solo deja constancia para el historial y para no volver a liquidar lo mismo.
 */
export async function markPayoutPaid(db: Db, payoutId: string, now: Date = new Date()): Promise<void> {
  await db
    .update(payouts)
    .set({ status: "released", settlement: "external", releasedAt: now })
    .where(and(eq(payouts.id, payoutId), eq(payouts.status, "pending")));
}

/** El trabajador confirma que recibió un pago informado por el contratador. */
export async function confirmPayoutReceived(db: Db, payoutId: string, now: Date = new Date()): Promise<void> {
  await db
    .update(payouts)
    .set({ confirmedAt: now })
    .where(and(eq(payouts.id, payoutId), eq(payouts.status, "released"), isNull(payouts.confirmedAt)));
}

// --- Retiros ---

/** Reserva el monto del saldo del trabajador y deja el retiro en la cola. */
export async function requestWithdrawal(
  db: Db,
  input: { workerId: string; amount: number; destination: string },
): Promise<string> {
  const { workerId, amount, destination } = input;
  if (!Number.isInteger(amount) || amount <= 0) throw new LedgerError("Monto inválido");
  return db.transaction(async (tx) => {
    const { minWithdrawal } = await getSettings(tx);
    if (amount < minWithdrawal) throw new LedgerError("El monto es menor al mínimo de retiro");
    const account = await getOrCreateAccount(tx, workerId, "worker");
    await lockAccount(tx, account.id);
    const available = await accountBalance(tx, account.id);
    if (available < amount) throw new InsufficientFundsError(available, amount);

    const [withdrawal] = await tx
      .insert(withdrawals)
      .values({ workerId, amount, destination })
      .returning({ id: withdrawals.id });
    await tx
      .insert(ledgerEntries)
      .values({ accountId: account.id, amount: -amount, type: "withdrawal", withdrawalId: withdrawal.id });
    return withdrawal.id;
  });
}

/** El admin marca el retiro como enviado, o lo rechaza y el monto vuelve al saldo del trabajador. */
export async function processWithdrawal(
  db: Db,
  input: { withdrawalId: string; adminId: string | null; outcome: "sent" | "rejected"; note?: string },
): Promise<void> {
  const { withdrawalId, adminId, outcome, note } = input;
  await db.transaction(async (tx) => {
    const [withdrawal] = await tx.select().from(withdrawals).where(eq(withdrawals.id, withdrawalId)).for("update");
    if (!withdrawal) throw new LedgerError("Retiro inexistente");
    if (withdrawal.status !== "requested") return;

    if (outcome === "rejected") {
      const account = await getOrCreateAccount(tx, withdrawal.workerId, "worker");
      await tx
        .insert(ledgerEntries)
        .values({ accountId: account.id, amount: withdrawal.amount, type: "refund", withdrawalId })
        .onConflictDoNothing();
    }
    await tx
      .update(withdrawals)
      .set({ status: outcome, note: note ?? null, processedBy: adminId, processedAt: new Date() })
      .where(eq(withdrawals.id, withdrawalId));
  });
}
