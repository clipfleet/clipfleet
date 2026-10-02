import { describe, expect, it } from "vitest";
import { computePayout, earnedFor, payRuleSchema, type PayRule } from "./index";

const cpm: PayRule = {
  fixedPerDeliverable: 0,
  variable: { type: "cpm", ratePerThousand: 50_000, minViews: 10_000, capPerDeliverable: 5_000_000 },
};

const tiers: PayRule = {
  fixedPerDeliverable: 0,
  variable: {
    type: "tiers",
    tiers: [
      { minViews: 100_000, amount: 4_000_000 },
      { minViews: 10_000, amount: 1_000_000 },
    ],
  },
};

describe("earnedFor", () => {
  it("paga fijo por entrega sin importar las vistas", () => {
    const rule: PayRule = { fixedPerDeliverable: 1_500_000, variable: null };
    expect(earnedFor(rule, 0).amount).toBe(1_500_000);
    expect(earnedFor(rule, 999_999).amount).toBe(1_500_000);
  });

  it("cpm: no paga debajo del mínimo de vistas", () => {
    expect(earnedFor(cpm, 9_999).amount).toBe(0);
  });

  it("cpm: paga proporcional a las vistas", () => {
    expect(earnedFor(cpm, 10_000).amount).toBe(500_000);
    expect(earnedFor(cpm, 12_345).amount).toBe(617_250);
  });

  it("cpm: respeta el tope por entrega", () => {
    expect(earnedFor(cpm, 10_000_000).amount).toBe(5_000_000);
  });

  it("tiers: paga el escalón más alto alcanzado, sin importar el orden", () => {
    expect(earnedFor(tiers, 9_999).amount).toBe(0);
    expect(earnedFor(tiers, 10_000).amount).toBe(1_000_000);
    expect(earnedFor(tiers, 99_999).amount).toBe(1_000_000);
    expect(earnedFor(tiers, 250_000).amount).toBe(4_000_000);
  });

  it("combina fijo y variable", () => {
    const rule: PayRule = { ...cpm, fixedPerDeliverable: 200_000 };
    expect(earnedFor(rule, 0).amount).toBe(200_000);
    expect(earnedFor(rule, 20_000).amount).toBe(1_200_000);
  });
});

describe("computePayout", () => {
  it("diez videos sin vistas no cobran; uno con 10 mil vistas sí", () => {
    const flops = Array.from({ length: 10 }, (_, i) => ({ id: `flop-${i}`, views: 300, alreadyPaid: 0 }));
    const result = computePayout(tiers, [...flops, { id: "hit", views: 10_000, alreadyPaid: 0 }]);
    expect(result.amount).toBe(1_000_000);
    expect(result.breakdown.filter((line) => line.amount > 0).map((line) => line.deliverableId)).toEqual(["hit"]);
  });

  it("paga solo la diferencia cuando las vistas siguen creciendo", () => {
    const first = computePayout(cpm, [{ id: "a", views: 20_000, alreadyPaid: 0 }]);
    expect(first.amount).toBe(1_000_000);
    const second = computePayout(cpm, [{ id: "a", views: 50_000, alreadyPaid: first.amount }]);
    expect(second.amount).toBe(1_500_000);
  });

  it("no paga dos veces un fijo ya cobrado ni devuelve negativo", () => {
    const rule: PayRule = { fixedPerDeliverable: 1_000_000, variable: null };
    expect(computePayout(rule, [{ id: "a", views: 0, alreadyPaid: 1_000_000 }]).amount).toBe(0);
    expect(computePayout(rule, [{ id: "a", views: 0, alreadyPaid: 2_000_000 }]).amount).toBe(0);
  });

  it("sin entregas no hay nada para liquidar", () => {
    expect(computePayout(cpm, [])).toEqual({ amount: 0, breakdown: [] });
  });
});

describe("payRuleSchema", () => {
  it("rechaza una regla que no paga nada", () => {
    expect(payRuleSchema.safeParse({ fixedPerDeliverable: 0, variable: null }).success).toBe(false);
  });

  it("rechaza montos con decimales", () => {
    expect(payRuleSchema.safeParse({ fixedPerDeliverable: 10.5, variable: null }).success).toBe(false);
  });
});
