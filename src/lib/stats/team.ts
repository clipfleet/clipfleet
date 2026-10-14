/** Lo mínimo de una contratación que hace falta para agruparla por persona. */
export type TeamContract = {
  worker: { username: string; name: string };
  contract: { id: string; status: "active" | "ended" };
  performance: { approvedDeliverables: number; totalViews: number };
  paid: number;
  owed: number;
};

/**
 * Una fila por persona: suma sus contrataciones y las deja listadas, en el
 * orden en que llegaron. El costo por mil solo cuenta lo pagado en
 * contrataciones que generaron vistas.
 */
export function teamByPerson<T extends TeamContract>(team: T[]) {
  const people = new Map<string, T[]>();
  for (const row of team) {
    const contracts = people.get(row.worker.username);
    if (contracts) contracts.push(row);
    else people.set(row.worker.username, [row]);
  }
  return [...people.values()].map((contracts) => {
    const sum = (pick: (row: T) => number) => contracts.reduce((total, row) => total + pick(row), 0);
    const views = sum((row) => row.performance.totalViews);
    const paidForViews = sum((row) => (row.performance.totalViews > 0 ? row.paid : 0));
    return {
      worker: contracts[0].worker,
      contracts,
      ended: contracts.every((row) => row.contract.status === "ended"),
      videos: sum((row) => row.performance.approvedDeliverables),
      views,
      costPerThousand: views > 0 && paidForViews > 0 ? Math.round((paidForViews * 1000) / views) : null,
      paid: sum((row) => row.paid),
      owed: sum((row) => row.owed),
    };
  });
}
