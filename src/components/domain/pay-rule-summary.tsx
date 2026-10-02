import clsx from "clsx";
import { formatInt, formatMoney } from "@/components/ui/format";

/** Misma forma que `PayRule` de `@/lib/payrules`. Montos en centavos enteros. */
export type PayRuleInput = {
  fixedPerDeliverable: number;
  variable:
    | null
    | { type: "cpm"; ratePerThousand: number; minViews?: number; capPerDeliverable?: number }
    | { type: "tiers"; tiers: { minViews: number; amount: number }[] };
};

type Line = { amount: string; text: string; detail?: string };

function ruleLines(rule: PayRuleInput): Line[] {
  const lines: Line[] = [];
  const { fixedPerDeliverable: fixed, variable } = rule;

  if (fixed > 0) {
    lines.push({ amount: formatMoney(fixed), text: "por video aprobado" });
  }

  if (variable?.type === "cpm") {
    const conditions = [
      variable.minViews ? `desde ${formatInt(variable.minViews)} vistas` : null,
      variable.capPerDeliverable ? `tope ${formatMoney(variable.capPerDeliverable)} por video` : null,
    ].filter(Boolean);
    lines.push({
      amount: formatMoney(variable.ratePerThousand),
      text: "cada 1.000 vistas",
      detail: conditions.length > 0 ? conditions.join(" · ") : undefined,
    });
  }

  if (variable?.type === "tiers") {
    const tiers = [...variable.tiers].sort((a, b) => a.minViews - b.minViews);
    for (const tier of tiers) {
      lines.push({ amount: formatMoney(tier.amount), text: `desde ${formatInt(tier.minViews)} vistas` });
    }
  }

  return lines;
}

/**
 * Regla de pago en una línea de texto, para `JobRow.payRuleSummary`, tablas y
 * metadata. Ejemplos:
 * - "$ 15.000 por video aprobado"
 * - "$ 1.200 cada 1.000 vistas (desde 10.000 vistas)"
 * - "$ 5.000 por video + $ 8.000 desde 10.000 vistas / $ 40.000 desde 100.000 vistas"
 */
export function payRuleText(rule: PayRuleInput): string {
  const { fixedPerDeliverable: fixed, variable } = rule;
  const parts: string[] = [];

  if (fixed > 0) {
    parts.push(`${formatMoney(fixed)} por video${variable ? "" : " aprobado"}`);
  }
  if (variable?.type === "cpm") {
    const [line] = ruleLines({ fixedPerDeliverable: 0, variable });
    parts.push(`${line.amount} ${line.text}${line.detail ? ` (${line.detail.replace(" · ", ", ")})` : ""}`);
  }
  if (variable?.type === "tiers") {
    parts.push(
      ruleLines({ fixedPerDeliverable: 0, variable })
        .map((line) => `${line.amount} ${line.text}`)
        .join(" / "),
    );
  }

  return parts.length > 0 ? parts.join(" + ") : "Sin regla de pago";
}

export type PayRuleSummaryProps = PayRuleInput & {
  /**
   * `block` (por defecto): una línea por componente de la regla, con el monto destacado.
   * `inline`: todo en una línea de texto (celdas de tabla, listados).
   */
  variant?: "block" | "inline";
  className?: string;
};

/**
 * Muestra una regla de pago de forma legible: fijo por video, variable por
 * cada 1.000 vistas (con mínimo y tope) o por escalones. Fijo y variable se suman.
 */
export function PayRuleSummary({ fixedPerDeliverable, variable, variant = "block", className }: PayRuleSummaryProps) {
  const rule: PayRuleInput = { fixedPerDeliverable, variable };

  if (variant === "inline") {
    return <span className={clsx("tabular-nums", className)}>{payRuleText(rule)}</span>;
  }

  const lines = ruleLines(rule);
  if (lines.length === 0) {
    return <p className={clsx("text-sm text-ink-3", className)}>Sin regla de pago.</p>;
  }

  const isTiers = variable?.type === "tiers";
  const hasFixed = fixedPerDeliverable > 0;

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      <ul className="flex flex-col divide-y divide-line">
        {lines.map((line, index) => (
          <li key={`${line.amount}-${line.text}`} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
            <span className="text-lg leading-6 font-semibold tracking-[-0.01em] text-ink tabular-nums">
              {hasFixed && variable && index === 1 ? <span className="mr-1 font-normal text-ink-3">+</span> : null}
              {line.amount}
            </span>
            <span className="text-sm text-ink-2">
              {line.text}
              {line.detail ? <span className="block text-[0.8125rem] text-ink-3">{line.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      {isTiers ? (
        <p className="text-[0.8125rem] leading-snug text-ink-3">
          Cada video cobra el escalón más alto que alcanzó{hasFixed ? ", además del fijo" : ""}.
        </p>
      ) : null}
    </div>
  );
}
