/**
 * Por ahora el producto es solo gestión de multicuentas: cuentas descartables que se crean
 * para cada trabajo y se usan para subir contenido de forma masiva. La categoría sigue en el
 * modelo para poder sumar otros tipos de trabajo más adelante.
 */
export const CATEGORIES = ["multicuentas"] as const;
export type Category = (typeof CATEGORIES)[number];
export const DEFAULT_CATEGORY: Category = "multicuentas";

export const CATEGORY_LABEL: Record<Category, string> = {
  multicuentas: "Multicuentas",
};

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

export function categoryLabel(value: string): string {
  return isCategory(value) ? CATEGORY_LABEL[value] : value;
}

export const PLATFORMS = ["tiktok", "instagram", "youtube", "otra"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  otra: "Otra",
};

/** Plataformas que se pueden elegir para una búsqueda o una invitación. Cada una paga sus vistas aparte. */
export const JOB_PLATFORMS = ["tiktok", "instagram", "youtube"] as const satisfies readonly Platform[];
export type JobPlatform = (typeof JOB_PLATFORMS)[number];

export function isJobPlatform(value: unknown): value is JobPlatform {
  return typeof value === "string" && (JOB_PLATFORMS as readonly string[]).includes(value);
}
