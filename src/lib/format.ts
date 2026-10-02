const moneyFormat = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const wholeMoneyFormat = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

/** Topes de entrada: ningún monto ni conteo legítimo los supera, y evitan números absurdos en la base. */
export const MAX_PESOS = 10_000_000_000;
export const MAX_COUNT = 100_000_000_000;

/** Centavos → "$ 15.000" (sin decimales si son ,00). */
export function formatMoney(cents: number): string {
  return cents % 100 === 0 ? wholeMoneyFormat.format(cents / 100) : moneyFormat.format(cents / 100);
}

/** Valor de un `<input type="number">` en pesos → centavos. Devuelve null si no es un monto válido. */
export function parsePesos(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const pesos = Number(value);
  if (!Number.isFinite(pesos) || pesos < 0 || pesos > MAX_PESOS) return null;
  return Math.round(pesos * 100);
}

/** Entero no negativo desde un campo de formulario, o null. */
export function parseCount(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 && count <= MAX_COUNT ? count : null;
}
