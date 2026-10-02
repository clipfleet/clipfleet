import clsx from "clsx";
import type { ReactNode } from "react";

export type StatGroupProps = {
  children: ReactNode;
  /** Cantidad de <Stat>. Máximo 3: es un presupuesto, no un objetivo. */
  cols?: 1 | 2 | 3;
  /** Nombre del grupo para lectores de pantalla, p. ej. "Resumen del equipo". */
  label?: string;
  className?: string;
};

const COLS: Record<NonNullable<StatGroupProps["cols"]>, string> = {
  1: "",
  2: "@lg:grid-cols-2",
  3: "@lg:grid-cols-3",
};

/**
 * Las cifras que resumen una pantalla. Sin recuadro: con lugar van en fila,
 * separadas por una línea fina; en angosto se apilan como "rótulo — valor".
 * Se acomoda según el ancho de su contenedor, no de la pantalla.
 */
export function StatGroup({ children, cols = 3, label, className }: StatGroupProps) {
  return (
    <div className={clsx("@container", className)}>
      <dl aria-label={label} className={clsx("grid", COLS[cols])}>
        {children}
      </dl>
    </div>
  );
}

export type StatProps = {
  /** Rótulo. Corto: 1 a 3 palabras. */
  label: ReactNode;
  /** El dato. Normalmente <Money> o <Num>; `null` muestra "—". */
  value: ReactNode;
  /** Aclaración. Solo si el número es ambiguo sin ella. */
  note?: ReactNode;
  className?: string;
};

/** Una cifra con su rótulo. Siempre dentro de <StatGroup>. */
export function Stat({ label, value, note, className }: StatProps) {
  const empty = value === null || value === undefined;
  return (
    <div
      className={clsx(
        "flex min-w-0 items-baseline justify-between gap-4 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0",
        "@lg:flex-col @lg:items-start @lg:justify-start @lg:gap-1 @lg:border-t-0 @lg:border-l @lg:py-0.5 @lg:pl-6 @lg:first:border-l-0 @lg:first:pl-0",
        className,
      )}
    >
      <dt className="type-label text-ink-3">{label}</dt>
      <dd className="flex min-w-0 flex-col items-end @lg:items-start">
        <span className={clsx("text-base font-semibold tracking-[-0.01em] tabular-nums @lg:text-2xl @lg:leading-8 @lg:tracking-[-0.02em]", empty ? "text-ink-3" : "text-ink")}>
          {empty ? "—" : value}
        </span>
        {note ? <span className="text-xs leading-snug text-ink-3">{note}</span> : null}
      </dd>
    </div>
  );
}
