import { z } from "zod";

// Todos los montos están en centavos enteros.

const cents = z.number().int().nonnegative().max(1_000_000_000_000);
const views = z.number().int().nonnegative().max(100_000_000_000);

export const variableRuleSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("cpm"),
    ratePerThousand: cents.positive(),
    minViews: views.optional(),
    capPerDeliverable: cents.positive().optional(),
  }),
  z.object({
    type: z.literal("tiers"),
    tiers: z
      .array(z.object({ minViews: views.positive(), amount: cents.positive() }))
      .min(1)
      .max(6),
  }),
]);

export const payRuleSchema = z
  .object({
    fixedPerDeliverable: cents,
    variable: variableRuleSchema.nullable(),
  })
  .refine((rule) => rule.fixedPerDeliverable > 0 || rule.variable !== null, {
    message: "La regla tiene que pagar algo: un fijo, un variable o ambos.",
  });

export type VariableRule = z.infer<typeof variableRuleSchema>;
export type PayRule = z.infer<typeof payRuleSchema>;

export type DeliverableFacts = {
  id: string;
  /** Vistas aprobadas por el contratador al momento de liquidar. */
  views: number;
  /** Lo ya cobrado por esta entrega en liquidaciones liberadas. */
  alreadyPaid: number;
};

export type PayoutLine = {
  deliverableId: string;
  views: number;
  earned: number;
  alreadyPaid: number;
  amount: number;
  reason: string;
};

function variableAmount(rule: VariableRule, viewCount: number): { amount: number; reason: string } {
  if (rule.type === "cpm") {
    const min = rule.minViews ?? 0;
    if (viewCount < min) return { amount: 0, reason: `no llegó al mínimo de ${min} vistas` };
    const raw = Math.floor((viewCount * rule.ratePerThousand) / 1000);
    if (rule.capPerDeliverable !== undefined && raw > rule.capPerDeliverable) {
      return { amount: rule.capPerDeliverable, reason: "tope por entrega alcanzado" };
    }
    return { amount: raw, reason: "por cada 1.000 vistas" };
  }
  const reached = [...rule.tiers]
    .sort((a, b) => b.minViews - a.minViews)
    .find((tier) => viewCount >= tier.minViews);
  if (!reached) return { amount: 0, reason: "no llegó al primer escalón" };
  return { amount: reached.amount, reason: `escalón de ${reached.minViews} vistas` };
}

/** Total que gana una entrega aprobada con esa cantidad de vistas. */
export function earnedFor(rule: PayRule, viewCount: number): { amount: number; reason: string } {
  if (!rule.variable) return { amount: rule.fixedPerDeliverable, reason: "fijo por entrega" };
  const variable = variableAmount(rule.variable, viewCount);
  const reason = rule.fixedPerDeliverable > 0 ? `fijo + ${variable.reason}` : variable.reason;
  return { amount: rule.fixedPerDeliverable + variable.amount, reason };
}

/**
 * Liquida entregas aprobadas. Cada entrega cobra la diferencia entre lo que ganó con sus
 * vistas actuales y lo ya cobrado, así las vistas que siguen creciendo se pagan en períodos
 * posteriores sin pagar dos veces lo mismo.
 */
export function computePayout(
  rule: PayRule,
  deliverables: DeliverableFacts[],
): { amount: number; breakdown: PayoutLine[] } {
  const breakdown = deliverables.map((deliverable) => {
    const earned = earnedFor(rule, deliverable.views);
    const amount = Math.max(0, earned.amount - deliverable.alreadyPaid);
    return {
      deliverableId: deliverable.id,
      views: deliverable.views,
      earned: earned.amount,
      alreadyPaid: deliverable.alreadyPaid,
      amount,
      reason: earned.reason,
    };
  });
  return { amount: breakdown.reduce((sum, line) => sum + line.amount, 0), breakdown };
}
