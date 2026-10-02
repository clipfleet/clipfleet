import { describe, expect, it } from "vitest";
import { contractPerformance, workerStats, type ContractForStats, type DeliverableForStats } from "./index";

const now = new Date("2026-09-30T12:00:00Z");
const day = (n: number) => new Date(`2026-09-${String(n).padStart(2, "0")}T12:00:00Z`);

function deliverable(overrides: Partial<DeliverableForStats> = {}): DeliverableForStats {
  return { status: "approved", views: 0, dueAt: null, submittedAt: day(1), qualityRating: null, ...overrides };
}

describe("workerStats", () => {
  it("sin historial devuelve ceros y nulos, no números inventados", () => {
    expect(workerStats([], [], now)).toEqual({
      totalViews: 0,
      avgViews: null,
      onTimePct: null,
      avgQuality: null,
      completedContracts: 0,
      rehireRate: null,
      approvedDeliverables: 0,
    });
  });

  it("solo las entregas aprobadas suman vistas y calidad", () => {
    const stats = workerStats(
      [
        deliverable({ views: 10_000, qualityRating: 5 }),
        deliverable({ views: 30_000, qualityRating: 4 }),
        deliverable({ status: "rejected", views: 999_999, qualityRating: 1 }),
        deliverable({ status: "submitted", views: 500 }),
      ],
      [],
      now,
    );
    expect(stats.totalViews).toBe(40_000);
    expect(stats.avgViews).toBe(20_000);
    expect(stats.avgQuality).toBe(4.5);
    expect(stats.approvedDeliverables).toBe(2);
  });

  it("puntualidad: solo cuentan entregas con fecha; las vencidas sin entregar son tarde", () => {
    const stats = workerStats(
      [
        deliverable({ dueAt: day(10), submittedAt: day(9) }),
        deliverable({ dueAt: day(10), submittedAt: day(11) }),
        deliverable({ status: "requested", dueAt: day(20), submittedAt: null }),
        deliverable({ status: "requested", dueAt: new Date("2026-10-15T00:00:00Z"), submittedAt: null }),
        deliverable({ dueAt: null }),
      ],
      [],
      now,
    );
    expect(stats.onTimePct).toBe(33);
  });

  it("contrataciones sin pago liberado no cuentan para el historial", () => {
    const contracts: ContractForStats[] = [
      { hirerId: "a", status: "ended", hasReleasedPayout: true },
      { hirerId: "a", status: "active", hasReleasedPayout: true },
      { hirerId: "b", status: "ended", hasReleasedPayout: true },
      { hirerId: "c", status: "ended", hasReleasedPayout: false },
    ];
    const stats = workerStats([], contracts, now);
    expect(stats.completedContracts).toBe(2);
    expect(stats.rehireRate).toBe(50);
  });
});

describe("contractPerformance", () => {
  it("calcula el costo por mil vistas sobre lo pagado", () => {
    const perf = contractPerformance([deliverable({ views: 40_000 }), deliverable({ views: 10_000 })], 2_500_000, now);
    expect(perf.totalViews).toBe(50_000);
    expect(perf.costPerThousand).toBe(50_000);
  });

  it("sin vistas o sin pagos no hay costo por mil", () => {
    expect(contractPerformance([deliverable()], 1_000, now).costPerThousand).toBeNull();
    expect(contractPerformance([deliverable({ views: 5_000 })], 0, now).costPerThousand).toBeNull();
  });

  it("cuenta lo pendiente de revisión", () => {
    const perf = contractPerformance([deliverable({ status: "submitted" }), deliverable()], 0, now);
    expect(perf.pendingReview).toBe(1);
  });
});
