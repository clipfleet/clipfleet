/**
 * Formato de plata, números y fechas en es-AR. Funciones puras: sirven en
 * Server y Client Components y dan el mismo texto en los dos lados.
 */

const NBSP = " ";
const MINUS = "−";
export const EMPTY = "—";

const TIME_ZONE = "America/Argentina/Buenos_Aires";

const moneyWithCents = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const moneyWhole = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const fixedOneDecimal = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Unifica los espacios que mete Intl (varían según la versión de ICU) para evitar diferencias servidor/cliente. */
function tidy(text: string): string {
  return text.replace(/\s/g, NBSP).replace(/^-/, MINUS);
}

export type MoneyDecimals = "auto" | "always" | "never";

/** Centavos enteros → pesos argentinos. `auto` muestra centavos solo si no son cero. */
export function formatMoney(cents: number, options: { decimals?: MoneyDecimals } = {}): string {
  const { decimals = "auto" } = options;
  const showCents = decimals === "always" || (decimals === "auto" && cents % 100 !== 0);
  return tidy((showCents ? moneyWithCents : moneyWhole).format(cents / 100));
}

/** Entero con separador de miles: 84.000 */
export function formatInt(value: number): string {
  return tidy(integer.format(value));
}

/** Número grande abreviado: 950 · 1,5 mil · 84 mil · 1,2 M · 3,4 mil M */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? MINUS : "";
  if (abs < 1_000) return tidy(integer.format(value));
  if (abs < 999_950) {
    const thousands = abs / 1_000;
    return `${sign}${(thousands < 100 ? oneDecimal : integer).format(thousands)}${NBSP}mil`;
  }
  if (abs < 999_950_000) {
    const millions = abs / 1_000_000;
    return `${sign}${(millions < 100 ? oneDecimal : integer).format(millions)}${NBSP}M`;
  }
  return `${sign}${oneDecimal.format(abs / 1_000_000_000)}${NBSP}mil${NBSP}M`;
}

/** Calificación 1–5 → "4,6" */
export function formatRating(value: number): string {
  return fixedOneDecimal.format(value);
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

const shortDate = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: TIME_ZONE });
const longDate = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

/** "28 sep" — siempre en hora de Buenos Aires. */
export function formatShortDate(value: Date | string): string {
  return shortDate.format(toDate(value)).replace(".", "");
}

/** "28 sep 2026" */
export function formatDate(value: Date | string): string {
  return longDate.format(toDate(value)).replace(/\./g, "").replace(/ de /g, " ");
}

/** Valor para el atributo dateTime de <time>. */
export function isoDate(value: Date | string): string {
  return toDate(value).toISOString();
}

/** Iniciales para Avatar: "Brenda Sosa" → "BS", "lucho" → "LU". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
