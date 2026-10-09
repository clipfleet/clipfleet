// Insignias de logros. Se derivan de los videos aprobados: no se guardan ni se declaran a mano,
// así que cambiar un umbral acá cambia para todos sin migrar datos.

export type BadgeFamily = "reach" | "volume" | "viral" | "streak";

export type BadgeFacts = {
  /** Vistas aprobadas acumuladas. */
  totalViews: number;
  /** Videos aprobados. */
  approvedVideos: number;
  /** Vistas aprobadas de su mejor video. */
  bestVideoViews: number;
  /** Racha más larga de días seguidos subiendo. */
  longestStreak: number;
};

type FamilyDefinition = {
  family: BadgeFamily;
  /** Nombre de la familia, para explicar qué premia. */
  name: string;
  thresholds: [number, number, number];
  value: (facts: BadgeFacts) => number;
  /** Cómo se lee la insignia de ese umbral. */
  label: (threshold: string) => string;
  /** Qué falta, para "te faltan N …". */
  unit: string;
};

const numberFormat = new Intl.NumberFormat("es-AR");

/** 100000 → "100 mil", 1000000 → "1 millón", 10000000 → "10 millones". Los umbrales son números redondos. */
function roundNumber(value: number): string {
  if (value >= 1_000_000) return value === 1_000_000 ? "1 millón" : `${numberFormat.format(value / 1_000_000)} millones`;
  if (value >= 10_000) return `${numberFormat.format(value / 1_000)} mil`;
  return numberFormat.format(value);
}

export const BADGE_FAMILIES: FamilyDefinition[] = [
  {
    family: "reach",
    name: "Alcance",
    thresholds: [100_000, 1_000_000, 10_000_000],
    value: (facts) => facts.totalViews,
    label: (threshold) => `${threshold} de vistas`,
    unit: "vistas",
  },
  {
    family: "volume",
    name: "Volumen",
    thresholds: [50, 250, 1_000],
    value: (facts) => facts.approvedVideos,
    label: (threshold) => `${threshold} videos`,
    unit: "videos",
  },
  {
    family: "viral",
    name: "Viral",
    thresholds: [100_000, 500_000, 1_000_000],
    value: (facts) => facts.bestVideoViews,
    label: (threshold) => `Un video de ${threshold}`,
    unit: "vistas en un video",
  },
  {
    family: "streak",
    name: "Constancia",
    thresholds: [7, 30, 90],
    value: (facts) => facts.longestStreak,
    label: (threshold) => `${threshold} días seguidos`,
    unit: "días seguidos",
  },
];

/** "100 mil de vistas" pero "1 millón de vistas": el umbral ya trae su unidad de magnitud. */
function badgeLabel(definition: FamilyDefinition, threshold: number): string {
  return definition.label(roundNumber(threshold));
}

export type EarnedBadge = {
  family: BadgeFamily;
  familyName: string;
  /** 1, 2 o 3. */
  level: 1 | 2 | 3;
  label: string;
};

/** De cada familia, el nivel más alto alcanzado. Como mucho, una insignia por familia. */
export function earnedBadges(facts: BadgeFacts): EarnedBadge[] {
  return BADGE_FAMILIES.flatMap((definition) => {
    const value = definition.value(facts);
    const reached = definition.thresholds.filter((threshold) => value >= threshold).length;
    if (reached === 0) return [];
    return [
      {
        family: definition.family,
        familyName: definition.name,
        level: reached as 1 | 2 | 3,
        label: badgeLabel(definition, definition.thresholds[reached - 1]),
      },
    ];
  });
}

export type NextBadge = {
  family: BadgeFamily;
  label: string;
  /** Cuánto falta, ya con su unidad: "68 videos". */
  missing: string;
  /** Avance hacia esa insignia, de 0 a 1. */
  progress: number;
};

/** La insignia que tiene más cerca, para mostrarle al gestor en su panel. null si ya tiene todas. */
export function nextBadge(facts: BadgeFacts): NextBadge | null {
  const candidates = BADGE_FAMILIES.flatMap((definition) => {
    const value = definition.value(facts);
    const threshold = definition.thresholds.find((candidate) => value < candidate);
    if (threshold === undefined) return [];
    return [
      {
        family: definition.family,
        label: badgeLabel(definition, threshold),
        missing: `${numberFormat.format(threshold - value)} ${definition.unit}`,
        progress: value / threshold,
      },
    ];
  });
  if (candidates.length === 0) return null;
  return candidates.reduce((closest, candidate) => (candidate.progress > closest.progress ? candidate : closest));
}
