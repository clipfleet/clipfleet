import clsx from "clsx";
import { EMPTY, formatCompact, formatInt } from "./format";

export type NumProps = {
  /** Número entero. `null` muestra "—". */
  value: number | null | undefined;
  /**
   * `true` (por defecto) abrevia: 84 mil, 1,2 M. El número completo queda en el `title`.
   * `false` muestra el número entero con separador de miles: 84.000.
   */
  compact?: boolean;
  /** Unidad después del número, p. ej. "vistas". */
  unit?: string;
  className?: string;
};

/** Número grande en es-AR (vistas, videos). Numerales tabulares. */
export function Num({ value, compact = true, unit, className }: NumProps) {
  if (value === null || value === undefined) {
    return <span className={clsx("text-ink-3", className)}>{EMPTY}</span>;
  }
  const full = formatInt(value);
  const text = compact ? formatCompact(value) : full;
  return (
    <span className={clsx("whitespace-nowrap tabular-nums", className)} title={compact && text !== full ? full : undefined}>
      {text}
      {unit ? ` ${unit}` : null}
    </span>
  );
}
