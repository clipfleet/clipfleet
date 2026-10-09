import { describe, expect, it } from "vitest";
import { earnedBadges, nextBadge, type BadgeFacts } from "./badges";

const none: BadgeFacts = { totalViews: 0, approvedVideos: 0, bestVideoViews: 0, longestStreak: 0 };

describe("earnedBadges", () => {
  it("un perfil nuevo no tiene insignias", () => {
    expect(earnedBadges(none)).toEqual([]);
  });

  it("se gana justo al llegar al umbral, no antes", () => {
    expect(earnedBadges({ ...none, approvedVideos: 49 })).toEqual([]);
    expect(earnedBadges({ ...none, approvedVideos: 50 })).toEqual([
      { family: "volume", familyName: "Volumen", level: 1, label: "50 videos" },
    ]);
  });

  it("muestra solo el nivel más alto de cada familia", () => {
    const badges = earnedBadges({ totalViews: 2_500_000, approvedVideos: 300, bestVideoViews: 600_000, longestStreak: 45 });
    expect(badges.map((badge) => [badge.family, badge.level, badge.label])).toEqual([
      ["reach", 2, "1 millón de vistas"],
      ["volume", 2, "250 videos"],
      ["viral", 2, "Un video de 500 mil"],
      ["streak", 2, "30 días seguidos"],
    ]);
  });

  it("escribe bien los umbrales grandes", () => {
    const badges = earnedBadges({ totalViews: 10_000_000, approvedVideos: 1_000, bestVideoViews: 1_000_000, longestStreak: 90 });
    expect(badges.map((badge) => badge.label)).toEqual(["10 millones de vistas", "1.000 videos", "Un video de 1 millón", "90 días seguidos"]);
    expect(badges.every((badge) => badge.level === 3)).toBe(true);
  });
});

describe("nextBadge", () => {
  it("elige la que tiene más cerca y dice cuánto falta", () => {
    const next = nextBadge({ totalViews: 20_000, approvedVideos: 40, bestVideoViews: 9_000, longestStreak: 2 });
    expect(next).toMatchObject({ family: "volume", label: "50 videos", missing: "10 videos" });
    expect(next?.progress).toBeCloseTo(0.8);
  });

  it("después de ganar un nivel apunta al siguiente de esa familia", () => {
    const next = nextBadge({ ...none, approvedVideos: 240 });
    expect(next).toMatchObject({ family: "volume", label: "250 videos", missing: "10 videos" });
  });

  it("no hay próxima cuando ya tiene todas", () => {
    expect(nextBadge({ totalViews: 10_000_000, approvedVideos: 1_000, bestVideoViews: 1_000_000, longestStreak: 90 })).toBeNull();
  });
});
