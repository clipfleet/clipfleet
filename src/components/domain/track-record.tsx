import clsx from "clsx";
import type { ReactNode } from "react";
import { Num } from "@/components/ui/num";

export type TrackRecordProps = {
  /** Suma de vistas de los videos aprobados. */
  totalViews: number | null;
  /** Vistas promedio por video aprobado. */
  avgViews: number | null;
  /** Videos aprobados. */
  approvedDeliverables: number | null;
  /** Contrataciones con al menos un pago informado. */
  completedContracts: number | null;
  className?: string;
};

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-surface px-4 py-4 sm:px-5">
      <dt className="type-label text-ink-3">{label}</dt>
      <dd className="text-2xl leading-8 font-semibold tracking-[-0.02em] tabular-nums">{children}</dd>
    </div>
  );
}

/**
 * El trayecto de un gestor de multicuentas en cuatro números: lo único que
 * vende son resultados. `null` o 0 se muestran como "—": nunca se inventa un dato.
 */
export function TrackRecord({ totalViews, avgViews, approvedDeliverables, completedContracts, className }: TrackRecordProps) {
  const value = (number: number | null, compact = true) => <Num value={number === null || number === 0 ? null : number} compact={compact} />;

  return (
    <dl aria-label="Trayecto" className={clsx("grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4", className)}>
      <Cell label="Vistas">{value(totalViews)}</Cell>
      <Cell label="Vistas por video">{value(avgViews)}</Cell>
      <Cell label="Videos aprobados">{value(approvedDeliverables, false)}</Cell>
      <Cell label="Contrataciones">{value(completedContracts, false)}</Cell>
    </dl>
  );
}
