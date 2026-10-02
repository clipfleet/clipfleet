import clsx from "clsx";
import { EMPTY, formatMoney, type MoneyDecimals } from "./format";

export type MoneyProps = {
  /** Monto en centavos enteros. `null` muestra "—". */
  cents: number | null | undefined;
  /**
   * `auto` (por defecto): muestra centavos solo si no son cero.
   * `always`: siempre ",00" — usalo en columnas de liquidaciones para que alineen.
   * `never`: redondea a pesos.
   */
  decimals?: MoneyDecimals;
  className?: string;
};

/** Pesos argentinos a partir de centavos. Numerales tabulares, sin corte de línea. */
export function Money({ cents, decimals = "auto", className }: MoneyProps) {
  if (cents === null || cents === undefined) {
    return <span className={clsx("text-ink-3", className)}>{EMPTY}</span>;
  }
  return <span className={clsx("whitespace-nowrap tabular-nums", className)}>{formatMoney(cents, { decimals })}</span>;
}
