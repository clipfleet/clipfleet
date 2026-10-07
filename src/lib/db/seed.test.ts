import { describe, expect, it } from "vitest";
import { ledgerEntries, payouts, user } from "./schema";
import { seedIfEmpty } from "./seed";
import { createTestDb } from "./testing";

describe("datos de demostración", () => {
  it("cargan una sola vez, con pagos por fuera confirmados y sin mover saldo", async () => {
    const db = await createTestDb();
    await seedIfEmpty(db);
    await seedIfEmpty(db);

    expect(await db.select().from(user)).toHaveLength(4);

    const rows = await db.select().from(payouts);
    expect(rows.map((row) => row.amount).sort((a, b) => a - b)).toEqual([6_600_000, 20_560_000]);
    for (const row of rows) {
      expect(row.status).toBe("released");
      expect(row.settlement).toBe("external");
      expect(row.fee).toBe(0);
      expect(row.confirmedAt).not.toBeNull();
    }
    // Sin comisión ni plata en custodia: el libro contable no se toca.
    expect(await db.select().from(ledgerEntries)).toHaveLength(0);
  });
});
