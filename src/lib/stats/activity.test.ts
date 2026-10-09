import { describe, expect, it } from "vitest";
import { buildCalendar, countByDay, dayKey, longestStreak } from "./activity";

// Buenos Aires está en UTC-3 todo el año.
const at = (iso: string) => new Date(iso);

describe("dayKey", () => {
  it("usa el día de Buenos Aires, no el de UTC", () => {
    // 23:30 del 4 de octubre en Buenos Aires ya es 5 de octubre en UTC.
    expect(dayKey(at("2026-10-05T02:30:00Z"))).toBe("2026-10-04");
    expect(dayKey(at("2026-10-05T03:00:00Z"))).toBe("2026-10-05");
  });
});

describe("countByDay", () => {
  it("agrupa varios videos del mismo día", () => {
    const counts = countByDay([at("2026-10-04T12:00:00Z"), at("2026-10-04T20:00:00Z"), at("2026-10-05T12:00:00Z")]);
    expect(counts.get("2026-10-04")).toBe(2);
    expect(counts.get("2026-10-05")).toBe(1);
  });
});

describe("longestStreak", () => {
  const streakOf = (...days: string[]) => longestStreak(new Map(days.map((day) => [day, 1])));

  it("sin actividad no hay racha", () => {
    expect(streakOf()).toBe(0);
  });

  it("cuenta días seguidos y se corta con un día sin subir", () => {
    expect(streakOf("2026-10-01", "2026-10-02", "2026-10-03", "2026-10-05", "2026-10-06")).toBe(3);
  });

  it("sigue la racha al cambiar de mes y de año", () => {
    expect(streakOf("2026-09-30", "2026-10-01")).toBe(2);
    expect(streakOf("2026-12-31", "2027-01-01", "2027-01-02")).toBe(3);
  });

  it("varios videos en un día cuentan como un solo día", () => {
    expect(longestStreak(new Map([["2026-10-01", 9]]))).toBe(1);
  });
});

describe("buildCalendar", () => {
  // Viernes 9 de octubre de 2026, mediodía en Buenos Aires.
  const today = at("2026-10-09T15:00:00Z");

  it("arma semanas de lunes a domingo y deja vacíos los días que todavía no llegaron", () => {
    const calendar = buildCalendar(new Map(), 2, today);
    expect(calendar.weeks).toHaveLength(2);
    expect(calendar.weeks[0].map((day) => day?.date)).toEqual([
      "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
    ]);
    expect(calendar.weeks[1].map((day) => day?.date ?? null)).toEqual([
      "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", null, null,
    ]);
  });

  it("la intensidad es relativa al mejor día del período", () => {
    const counts = new Map([["2026-10-05", 1], ["2026-10-06", 10], ["2026-10-07", 20], ["2026-10-08", 5]]);
    const week = buildCalendar(counts, 1, today).weeks[0];
    expect(week.map((day) => day?.level ?? null)).toEqual([1, 2, 4, 1, 0, null, null]);
  });

  it("totaliza solo lo que cae dentro del período mostrado", () => {
    const counts = new Map([["2026-10-06", 3], ["2026-10-08", 2], ["2026-01-01", 50]]);
    const calendar = buildCalendar(counts, 2, today);
    expect(calendar.total).toBe(5);
    expect(calendar.activeDays).toBe(2);
  });

  it("un calendario sin actividad no divide por cero", () => {
    const calendar = buildCalendar(new Map(), 1, today);
    expect(calendar.total).toBe(0);
    expect(calendar.weeks[0].every((day) => day === null || day.level === 0)).toBe(true);
  });
});
