import { describe, expect, it } from "vitest";
import { teamByPerson, type TeamContract } from "./team";

function row(username: string, id: string, overrides: Partial<{ status: "active" | "ended"; videos: number; views: number; paid: number; owed: number }> = {}): TeamContract {
  return {
    worker: { username, name: username },
    contract: { id, status: overrides.status ?? "active" },
    performance: { approvedDeliverables: overrides.videos ?? 0, totalViews: overrides.views ?? 0 },
    paid: overrides.paid ?? 0,
    owed: overrides.owed ?? 0,
  };
}

describe("teamByPerson", () => {
  it("junta las contrataciones de una misma persona y suma sus números", () => {
    const people = teamByPerson([
      row("tomi", "c1", { videos: 2, views: 10_000, paid: 5_000, owed: 1_000 }),
      row("cami", "c2", { videos: 1, views: 4_000 }),
      row("tomi", "c3", { videos: 3, views: 30_000, paid: 15_000 }),
    ]);
    expect(people.map((person) => person.worker.username)).toEqual(["tomi", "cami"]);
    const [tomi] = people;
    expect(tomi.contracts.map((c) => c.contract.id)).toEqual(["c1", "c3"]);
    expect(tomi).toMatchObject({ videos: 5, views: 40_000, paid: 20_000, owed: 1_000, costPerThousand: 500 });
  });

  it("el costo por mil ignora lo pagado en contrataciones sin vistas", () => {
    const [person] = teamByPerson([row("tomi", "c1", { views: 10_000, paid: 5_000 }), row("tomi", "c2", { paid: 99_000 })]);
    expect(person.costPerThousand).toBe(500);
  });

  it("sin vistas o sin pagos no hay costo por mil", () => {
    expect(teamByPerson([row("tomi", "c1", { paid: 5_000 })])[0].costPerThousand).toBeNull();
    expect(teamByPerson([row("tomi", "c1", { views: 5_000 })])[0].costPerThousand).toBeNull();
  });

  it("una persona queda como finalizada solo si terminaron todas sus contrataciones", () => {
    expect(teamByPerson([row("tomi", "c1", { status: "ended" }), row("tomi", "c2")])[0].ended).toBe(false);
    expect(teamByPerson([row("tomi", "c1", { status: "ended" })])[0].ended).toBe(true);
  });
});
