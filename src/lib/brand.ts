/**
 * Identidad de marca. Único lugar donde vive el nombre del producto:
 * ningún componente ni pantalla lo escribe a mano.
 */
export const BRAND = {
  name: "Clipfleet",
  tagline: "Gestión de multicuentas.",
  /** Una línea para metadata y pie de página. */
  description: "Encontrá gente para subir tu contenido en multicuentas y gestioná a tu equipo por resultados.",
  locale: "es-AR",
  currency: "ARS",
  timeZone: "America/Argentina/Buenos_Aires",
} as const;

export type Brand = typeof BRAND;
