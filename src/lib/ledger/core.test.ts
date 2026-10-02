import { describe, expect, it } from "vitest";
import { buildReleaseEntries, splitPayout, sumBalance } from "./core";

describe("splitPayout", () => {
  it("3% encima al contratador: el trabajador recibe el 100%", () => {
    expect(splitPayout({ amount: 1_000_000, feeBps: 300, feePayer: "hirer" })).toEqual({
      fee: 30_000,
      hirerDebit: 1_030_000,
      workerCredit: 1_000_000,
    });
  });

  it("comisión descontada al trabajador", () => {
    expect(splitPayout({ amount: 1_000_000, feeBps: 300, feePayer: "worker" })).toEqual({
      fee: 30_000,
      hirerDebit: 1_000_000,
      workerCredit: 970_000,
    });
  });

  it("redondea la comisión al centavo", () => {
    expect(splitPayout({ amount: 3_333, feeBps: 300, feePayer: "hirer" }).fee).toBe(100);
  });

  it("sin comisión no hay diferencia entre lo debitado y lo acreditado", () => {
    const split = splitPayout({ amount: 500, feeBps: 0, feePayer: "hirer" });
    expect(split).toEqual({ fee: 0, hirerDebit: 500, workerCredit: 500 });
  });

  it("rechaza montos no enteros o negativos y comisiones fuera de rango", () => {
    expect(() => splitPayout({ amount: 10.5, feeBps: 300, feePayer: "hirer" })).toThrow();
    expect(() => splitPayout({ amount: -1, feeBps: 300, feePayer: "hirer" })).toThrow();
    expect(() => splitPayout({ amount: 100, feeBps: 10_001, feePayer: "hirer" })).toThrow();
  });
});

describe("buildReleaseEntries", () => {
  const ids = { hirerAccountId: "h", workerAccountId: "w", feeAccountId: "f" };

  it.each(["hirer", "worker"] as const)("los asientos suman cero (paga %s)", (feePayer) => {
    const split = splitPayout({ amount: 777_777, feeBps: 300, feePayer });
    expect(sumBalance(buildReleaseEntries({ ...ids, split }))).toBe(0);
  });

  it("no genera asiento de comisión cuando es cero", () => {
    const split = splitPayout({ amount: 1_000, feeBps: 0, feePayer: "hirer" });
    expect(buildReleaseEntries({ ...ids, split })).toHaveLength(2);
  });
});
