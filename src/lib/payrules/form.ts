import { parseCount, parsePesos } from "@/lib/format";
import { payRuleSchema, type PayRule, type VariableRule } from "./index";

export const MAX_TIERS = 3;

/** Lee la regla de pago de los campos de `PayRuleFields`. */
export function payRuleFromForm(form: FormData): { rule: PayRule } | { error: string } {
  const fixed = parsePesos(form.get("fixed")) ?? 0;
  const variableType = form.get("variableType");
  let variable: VariableRule | null = null;

  if (variableType === "cpm") {
    const rate = parsePesos(form.get("cpmRate"));
    if (!rate) return { error: "Indicá cuánto pagás cada 1.000 vistas." };
    const minViews = parseCount(form.get("cpmMinViews"));
    const cap = parsePesos(form.get("cpmCap"));
    variable = {
      type: "cpm",
      ratePerThousand: rate,
      ...(minViews ? { minViews } : {}),
      ...(cap ? { capPerDeliverable: cap } : {}),
    };
  } else if (variableType === "tiers") {
    const tiers: { minViews: number; amount: number }[] = [];
    for (let i = 1; i <= MAX_TIERS; i++) {
      const minViews = parseCount(form.get(`tierViews${i}`));
      const amount = parsePesos(form.get(`tierAmount${i}`));
      if (!minViews && !amount) continue;
      if (!minViews || !amount) return { error: `Completá vistas y monto del escalón ${i}.` };
      tiers.push({ minViews, amount });
    }
    if (tiers.length === 0) return { error: "Cargá al menos un escalón de vistas." };
    if (new Set(tiers.map((tier) => tier.minViews)).size !== tiers.length) {
      return { error: "Hay dos escalones con la misma cantidad de vistas." };
    }
    variable = { type: "tiers", tiers: tiers.sort((a, b) => a.minViews - b.minViews) };
  }

  const parsed = payRuleSchema.safeParse({ fixedPerDeliverable: fixed, variable });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Regla de pago inválida." };
  return { rule: parsed.data };
}
