/**
 * Identidad de marca. Único lugar donde vive el nombre del producto:
 * ningún componente ni pantalla lo escribe a mano.
 */
export const BRAND = {
  name: "ClipFleet",
  tagline: "Más vistas para tu contenido, ingresos por subirlo.",
  /** Una línea para metadata y pie de página. */
  description: "Publicá una campaña y pagá solo por las vistas que aprobás, o cobrá por cada vista que generás subiendo videos.",
  locale: "es-AR",
  currency: "ARS",
  timeZone: "America/Argentina/Buenos_Aires",
} as const;

export type Brand = typeof BRAND;
