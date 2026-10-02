// Métricas derivadas de entregas y contrataciones. Nadie las escribe a mano.

export type DeliverableForStats = {
  status: "requested" | "submitted" | "approved" | "rejected";
  views: number;
  dueAt: Date | null;
  submittedAt: Date | null;
  qualityRating: number | null;
};

export type ContractForStats = {
  hirerId: string;
  status: "active" | "ended";
  /** Hubo al menos una liquidación liberada. */
  hasReleasedPayout: boolean;
};

export type WorkerStats = {
  totalViews: number;
  avgViews: number | null;
  onTimePct: number | null;
  avgQuality: number | null;
  completedContracts: number;
  rehireRate: number | null;
  approvedDeliverables: number;
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pct(part: number, total: number): number | null {
  return total === 0 ? null : Math.round((part / total) * 100);
}

/** % de entregas con fecha pactada que llegaron a tiempo. Las pedidas y vencidas sin entregar cuentan como tarde. */
export function onTimePct(deliverables: DeliverableForStats[], now: Date = new Date()): number | null {
  const withDue = deliverables.filter(
    (d) => d.dueAt !== null && (d.submittedAt !== null || d.dueAt.getTime() < now.getTime()),
  );
  const onTime = withDue.filter((d) => d.submittedAt !== null && d.submittedAt.getTime() <= d.dueAt!.getTime());
  return pct(onTime.length, withDue.length);
}

export function avgQuality(deliverables: DeliverableForStats[]): number | null {
  const ratings = deliverables.flatMap((d) => (d.qualityRating !== null ? [d.qualityRating] : []));
  const value = average(ratings);
  return value === null ? null : Math.round(value * 10) / 10;
}

export function workerStats(
  deliverables: DeliverableForStats[],
  contracts: ContractForStats[],
  now: Date = new Date(),
): WorkerStats {
  const approved = deliverables.filter((d) => d.status === "approved");
  const totalViews = approved.reduce((sum, d) => sum + d.views, 0);
  const avg = average(approved.map((d) => d.views));

  // Solo cuenta trabajo efectivamente pagado adentro: inflar el perfil cuesta comisión.
  const paid = contracts.filter((c) => c.hasReleasedPayout);
  const perHirer = new Map<string, number>();
  for (const contract of paid) perHirer.set(contract.hirerId, (perHirer.get(contract.hirerId) ?? 0) + 1);
  const rehired = [...perHirer.values()].filter((count) => count > 1).length;

  return {
    totalViews,
    avgViews: avg === null ? null : Math.round(avg),
    onTimePct: onTimePct(deliverables, now),
    avgQuality: avgQuality(approved),
    completedContracts: paid.filter((c) => c.status === "ended").length,
    rehireRate: pct(rehired, perHirer.size),
    approvedDeliverables: approved.length,
  };
}

export type ContractPerformance = {
  approvedDeliverables: number;
  pendingReview: number;
  totalViews: number;
  avgViews: number | null;
  onTimePct: number | null;
  avgQuality: number | null;
  /** Costo por 1.000 vistas, en centavos. */
  costPerThousand: number | null;
};

/** Rendimiento de una contratación para el CRM. `paid` es lo liberado al trabajador, en centavos. */
export function contractPerformance(
  deliverables: DeliverableForStats[],
  paid: number,
  now: Date = new Date(),
): ContractPerformance {
  const approved = deliverables.filter((d) => d.status === "approved");
  const totalViews = approved.reduce((sum, d) => sum + d.views, 0);
  const avg = average(approved.map((d) => d.views));
  return {
    approvedDeliverables: approved.length,
    pendingReview: deliverables.filter((d) => d.status === "submitted").length,
    totalViews,
    avgViews: avg === null ? null : Math.round(avg),
    onTimePct: onTimePct(deliverables, now),
    avgQuality: avgQuality(approved),
    costPerThousand: totalViews === 0 || paid === 0 ? null : Math.round((paid * 1000) / totalViews),
  };
}
