import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { contracts, deliverables, deposits, ledgerEntries, payouts, user } from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/testing";
import type { Db } from "@/lib/db/types";
import { payeeFor, savePayeeDetails, savePayerHolder } from "@/lib/payment-details/service";
import type { PayRule } from "@/lib/payrules";
import { InsufficientFundsError, sumBalance } from "./core";
import {
  confirmDeposit,
  confirmPayoutReceived,
  generatePayout,
  getBalance,
  getReservedByHirer,
  markPayoutPaid,
  processWithdrawal,
  releasePayout,
  requestWithdrawal,
} from "./service";

const tiers: PayRule = {
  fixedPerDeliverable: 0,
  variable: { type: "tiers", tiers: [{ minViews: 10_000, amount: 1_000_000 }] },
};

let db: Db;

async function seedContract(rule: PayRule = tiers, feePayer: "hirer" | "worker" = "hirer") {
  await db.insert(user).values([
    { id: "hirer", name: "Marca", email: "h@test.local", role: "hirer", username: "marca" },
    { id: "worker", name: "Clipper", email: "w@test.local", role: "worker", username: "clipper" },
    { id: "admin", name: "Admin", email: "a@test.local", role: "admin", username: "admin" },
  ]);
  const [contract] = await db
    .insert(contracts)
    .values({
      hirerId: "hirer",
      workerId: "worker",
      origin: "invite",
      title: "Clips",
      category: "multicuentas",
      payRule: rule,
      feeBps: 300,
      feePayer,
    })
    .returning();
  return contract;
}

async function deposit(amount: number) {
  const [row] = await db.insert(deposits).values({ hirerId: "hirer", amount, provider: "test" }).returning();
  await confirmDeposit(db, row.id);
  return row.id;
}

async function approvedDeliverable(contractId: string, views: number) {
  const [row] = await db
    .insert(deliverables)
    .values({ contractId, status: "approved", views, submittedAt: new Date() })
    .returning();
  return row.id;
}

beforeEach(async () => {
  db = await createTestDb();
});

describe("depósitos", () => {
  it("acredita el saldo una sola vez aunque el webhook se repita", async () => {
    await seedContract();
    const depositId = await deposit(5_000_000);
    await confirmDeposit(db, depositId);
    await confirmDeposit(db, depositId);
    expect(await getBalance(db, "hirer", "hirer")).toBe(5_000_000);
  });
});

describe("liquidaciones", () => {
  it("no genera liquidación si no hubo resultados", async () => {
    const contract = await seedContract();
    await approvedDeliverable(contract.id, 300);
    expect(await generatePayout(db, contract.id)).toBeNull();
  });

  it("libera: trabajador 100%, 3% encima al contratador, y el libro suma cero", async () => {
    const contract = await seedContract();
    await deposit(5_000_000);
    await approvedDeliverable(contract.id, 12_000);
    const payoutId = (await generatePayout(db, contract.id))!;
    expect(await getReservedByHirer(db, "hirer")).toBe(1_030_000);

    await releasePayout(db, payoutId);

    expect(await getBalance(db, "worker", "worker")).toBe(1_000_000);
    expect(await getBalance(db, "hirer", "hirer")).toBe(5_000_000 - 1_030_000);
    expect(await getBalance(db, null, "platform_fees")).toBe(30_000);
    expect(await getReservedByHirer(db, "hirer")).toBe(0);
    const payoutEntries = await db.select().from(ledgerEntries).where(eq(ledgerEntries.payoutId, payoutId));
    expect(sumBalance(payoutEntries)).toBe(0);
  });

  it("liberar dos veces no mueve plata dos veces", async () => {
    const contract = await seedContract();
    await deposit(5_000_000);
    await approvedDeliverable(contract.id, 12_000);
    const payoutId = (await generatePayout(db, contract.id))!;
    await releasePayout(db, payoutId);
    await releasePayout(db, payoutId);
    expect(await getBalance(db, "worker", "worker")).toBe(1_000_000);
  });

  it("no libera sin saldo suficiente y no deja asientos a medias", async () => {
    const contract = await seedContract();
    await deposit(1_000_000); // alcanza para el pago pero no para pago + comisión
    await approvedDeliverable(contract.id, 12_000);
    const payoutId = (await generatePayout(db, contract.id))!;

    await expect(releasePayout(db, payoutId)).rejects.toBeInstanceOf(InsufficientFundsError);

    expect(await getBalance(db, "hirer", "hirer")).toBe(1_000_000);
    expect(await getBalance(db, "worker", "worker")).toBe(0);
    const [payout] = await db.select().from(payouts).where(eq(payouts.id, payoutId));
    expect(payout.status).toBe("pending");
  });

  it("una entrega ya pagada no se vuelve a cobrar; solo se paga el crecimiento", async () => {
    const cpm: PayRule = { fixedPerDeliverable: 0, variable: { type: "cpm", ratePerThousand: 50_000 } };
    const contract = await seedContract(cpm);
    await deposit(10_000_000);
    const deliverableId = await approvedDeliverable(contract.id, 20_000);
    await releasePayout(db, (await generatePayout(db, contract.id))!);
    expect(await getBalance(db, "worker", "worker")).toBe(1_000_000);

    expect(await generatePayout(db, contract.id)).toBeNull();

    await db.update(deliverables).set({ views: 50_000 }).where(eq(deliverables.id, deliverableId));
    await releasePayout(db, (await generatePayout(db, contract.id))!);
    expect(await getBalance(db, "worker", "worker")).toBe(2_500_000);
  });

  it("regenerar reemplaza la liquidación pendiente en vez de duplicarla", async () => {
    const contract = await seedContract();
    await approvedDeliverable(contract.id, 12_000);
    await generatePayout(db, contract.id);
    await approvedDeliverable(contract.id, 15_000);
    await generatePayout(db, contract.id);
    const pending = await db.select().from(payouts).where(eq(payouts.contractId, contract.id));
    expect(pending).toHaveLength(1);
    expect(pending[0].amount).toBe(2_000_000);
  });

  it("comisión a cargo del trabajador: se descuenta de lo que recibe", async () => {
    const contract = await seedContract(tiers, "worker");
    await deposit(1_000_000);
    await approvedDeliverable(contract.id, 12_000);
    await releasePayout(db, (await generatePayout(db, contract.id))!);
    expect(await getBalance(db, "hirer", "hirer")).toBe(0);
    expect(await getBalance(db, "worker", "worker")).toBe(970_000);
    expect(await getBalance(db, null, "platform_fees")).toBe(30_000);
  });
});

describe("pagos por fuera de la plataforma", () => {
  it("informar el pago no mueve saldo y evita volver a liquidar lo mismo", async () => {
    const contract = await seedContract();
    await approvedDeliverable(contract.id, 12_000);
    const payoutId = (await generatePayout(db, contract.id))!;

    await markPayoutPaid(db, payoutId);

    const [payout] = await db.select().from(payouts).where(eq(payouts.id, payoutId));
    expect(payout.status).toBe("released");
    expect(payout.settlement).toBe("external");
    expect(payout.confirmedAt).toBeNull();
    expect(await db.select().from(ledgerEntries)).toHaveLength(0);
    expect(await generatePayout(db, contract.id)).toBeNull();
  });

  it("el trabajador confirma el cobro solo de un pago ya informado, y una sola vez", async () => {
    const contract = await seedContract();
    await approvedDeliverable(contract.id, 12_000);
    const payoutId = (await generatePayout(db, contract.id))!;

    await confirmPayoutReceived(db, payoutId);
    let [payout] = await db.select().from(payouts).where(eq(payouts.id, payoutId));
    expect(payout.confirmedAt).toBeNull();

    await markPayoutPaid(db, payoutId);
    const first = new Date("2026-10-01T12:00:00Z");
    await confirmPayoutReceived(db, payoutId, first);
    await confirmPayoutReceived(db, payoutId, new Date("2026-10-02T12:00:00Z"));
    [payout] = await db.select().from(payouts).where(eq(payouts.id, payoutId));
    expect(payout.confirmedAt?.toISOString()).toBe(first.toISOString());
  });
});

describe("retiros", () => {
  async function workerWith(amount: number) {
    const contract = await seedContract({ fixedPerDeliverable: amount, variable: null });
    await deposit(amount * 2);
    await approvedDeliverable(contract.id, 0);
    await releasePayout(db, (await generatePayout(db, contract.id))!);
  }

  it("reserva el monto al pedir el retiro y no permite retirar de más", async () => {
    await workerWith(1_000_000);
    await requestWithdrawal(db, { workerId: "worker", amount: 600_000, destination: "alias.test" });
    expect(await getBalance(db, "worker", "worker")).toBe(400_000);
    await expect(
      requestWithdrawal(db, { workerId: "worker", amount: 600_000, destination: "alias.test" }),
    ).rejects.toBeInstanceOf(InsufficientFundsError);
  });

  it("un retiro rechazado devuelve el monto una sola vez", async () => {
    await workerWith(1_000_000);
    const withdrawalId = await requestWithdrawal(db, { workerId: "worker", amount: 600_000, destination: "alias.test" });
    await processWithdrawal(db, { withdrawalId, adminId: "admin", outcome: "rejected", note: "alias inválido" });
    await processWithdrawal(db, { withdrawalId, adminId: "admin", outcome: "rejected" });
    expect(await getBalance(db, "worker", "worker")).toBe(1_000_000);
  });

  it("un retiro enviado no vuelve al saldo", async () => {
    await workerWith(1_000_000);
    const withdrawalId = await requestWithdrawal(db, { workerId: "worker", amount: 1_000_000, destination: "alias.test" });
    await processWithdrawal(db, { withdrawalId, adminId: "admin", outcome: "sent" });
    expect(await getBalance(db, "worker", "worker")).toBe(0);
  });
});

describe("datos de pago entre las partes", () => {
  async function pendingPayout() {
    const contract = await seedContract();
    await approvedDeliverable(contract.id, 12_000);
    return { contract, payoutId: (await generatePayout(db, contract.id))! };
  }

  it("al marcar pagado guarda a qué cuenta y a nombre de quién fue, y no cambia si después cambian los datos", async () => {
    const { payoutId } = await pendingPayout();
    await savePayeeDetails(db, "worker", { holderName: "Tomás Agüero", account: "clips.tomi", accountKind: "alias" });
    await savePayerHolder(db, "hirer", "Canal Demo SRL");

    await markPayoutPaid(db, payoutId);
    await savePayeeDetails(db, "worker", { holderName: "Otra Persona", account: "otro.alias", accountKind: "alias" });

    const [payout] = await db.select().from(payouts).where(eq(payouts.id, payoutId));
    expect(payout.paidToAccount).toBe("clips.tomi");
    expect(payout.paidToHolder).toBe("Tomás Agüero");
    expect(payout.paidFromHolder).toBe("Canal Demo SRL");
  });

  it("sin datos cargados igual se puede marcar pagado, sin inventar destino", async () => {
    const { payoutId } = await pendingPayout();
    await markPayoutPaid(db, payoutId);
    const [payout] = await db.select().from(payouts).where(eq(payouts.id, payoutId));
    expect(payout.status).toBe("released");
    expect(payout.paidToAccount).toBeNull();
    expect(payout.paidFromHolder).toBeNull();
  });

  it("el contratador no ve destino si el gestor no cargó una cuenta", async () => {
    await seedContract();
    expect(await payeeFor(db, "hirer", "worker")).toBeNull();
    // Un contratador solo carga titular: eso no es un destino de cobro.
    await savePayerHolder(db, "worker", "Solo Titular");
    expect(await payeeFor(db, "hirer", "worker")).toBeNull();
  });

  it("avisa si la cuenta cambió desde el último pago de ese contratador, y solo entonces", async () => {
    const { contract, payoutId } = await pendingPayout();
    await savePayeeDetails(db, "worker", { holderName: "Tomás Agüero", account: "clips.tomi", accountKind: "alias" });
    expect((await payeeFor(db, "hirer", "worker"))?.changedSinceLastPayment).toBe(false);

    await markPayoutPaid(db, payoutId);
    expect((await payeeFor(db, "hirer", "worker"))?.changedSinceLastPayment).toBe(false);

    await savePayeeDetails(db, "worker", { holderName: "Tomás Agüero", account: "alias.nuevo", accountKind: "alias" });
    expect((await payeeFor(db, "hirer", "worker"))?.changedSinceLastPayment).toBe(true);

    // Una vez que se le paga a la cuenta nueva, deja de avisar.
    await approvedDeliverable(contract.id, 15_000);
    await markPayoutPaid(db, (await generatePayout(db, contract.id))!, new Date(Date.now() + 1000));
    expect((await payeeFor(db, "hirer", "worker"))?.changedSinceLastPayment).toBe(false);
  });
});
