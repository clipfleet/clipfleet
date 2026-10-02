// Núcleo puro del libro contable. Montos en centavos enteros.

export type FeePayer = "hirer" | "worker";

export type EntryType = "deposit" | "payout" | "fee" | "withdrawal" | "refund";

export type PayoutSplit = {
  /** Comisión de la plataforma. */
  fee: number;
  /** Lo que sale del saldo del contratador. */
  hirerDebit: number;
  /** Lo que entra al saldo del trabajador. */
  workerCredit: number;
};

/**
 * Único lugar donde vive la regla de comisión.
 * `hirer`: la comisión se cobra encima y el trabajador recibe el 100% de lo acordado.
 * `worker`: la comisión se descuenta de lo que recibe el trabajador.
 */
export function splitPayout(input: { amount: number; feeBps: number; feePayer: FeePayer }): PayoutSplit {
  const { amount, feeBps, feePayer } = input;
  if (!Number.isInteger(amount) || amount < 0) throw new Error("Monto inválido");
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) throw new Error("Comisión inválida");
  const fee = Math.round((amount * feeBps) / 10_000);
  return feePayer === "hirer"
    ? { fee, hirerDebit: amount + fee, workerCredit: amount }
    : { fee, hirerDebit: amount, workerCredit: amount - fee };
}

export type ReleaseEntry = { accountId: string; amount: number; type: EntryType };

/** Asientos de una liberación: siempre suman cero. */
export function buildReleaseEntries(input: {
  hirerAccountId: string;
  workerAccountId: string;
  feeAccountId: string;
  split: PayoutSplit;
}): ReleaseEntry[] {
  const { hirerAccountId, workerAccountId, feeAccountId, split } = input;
  const entries: ReleaseEntry[] = [
    { accountId: hirerAccountId, amount: -split.hirerDebit, type: "payout" },
    { accountId: workerAccountId, amount: split.workerCredit, type: "payout" },
  ];
  if (split.fee > 0) entries.push({ accountId: feeAccountId, amount: split.fee, type: "fee" });
  return entries;
}

export function sumBalance(entries: { amount: number }[]): number {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

export class InsufficientFundsError extends Error {
  constructor(
    public readonly available: number,
    public readonly required: number,
  ) {
    super("Saldo insuficiente");
    this.name = "InsufficientFundsError";
  }
}
