// Datos de pago entre las partes: validación pura, sin base ni red.

export type AccountKind = "alias" | "cbu" | "cvu";

export type ParsedAccount = { account: string; kind: AccountKind };

const ALIAS = /^[a-z0-9.-]{6,20}$/;

/** Dígito verificador de un bloque de CBU: complemento a 10 de la suma ponderada. */
function checkDigit(digits: string, weights: number[]): number {
  const sum = [...digits].reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  return (10 - (sum % 10)) % 10;
}

/** Valida los dos dígitos verificadores de un CBU de 22 dígitos. */
export function isValidCbu(value: string): boolean {
  if (!/^\d{22}$/.test(value)) return false;
  const first = checkDigit(value.slice(0, 7), [7, 1, 3, 9, 7, 1, 3]) === Number(value[7]);
  const second = checkDigit(value.slice(8, 21), [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]) === Number(value[21]);
  return first && second;
}

/**
 * Interpreta lo que escribió la persona como alias, CBU o CVU. Devuelve el error para mostrar
 * si no es ninguno de los tres.
 *
 * El CBU se valida con sus dígitos verificadores, que atrapan un dígito mal tipeado. El CVU
 * (22 dígitos que empiezan con 000) solo se valida por formato.
 */
export function parseAccount(input: string): ParsedAccount | { error: string } {
  const compact = input.trim().replace(/[\s-]/g, "");
  if (/^\d+$/.test(compact)) {
    if (compact.length !== 22) return { error: "Un CBU o CVU tiene 22 dígitos. Revisá que esté completo." };
    if (compact.startsWith("000")) return { account: compact, kind: "cvu" };
    if (!isValidCbu(compact)) return { error: "Ese CBU no es válido: revisá los dígitos." };
    return { account: compact, kind: "cbu" };
  }
  const alias = input.trim().toLowerCase();
  if (!ALIAS.test(alias)) {
    return { error: "El alias tiene entre 6 y 20 caracteres: letras, números, puntos o guiones." };
  }
  return { account: alias, kind: "alias" };
}

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = { alias: "Alias", cbu: "CBU", cvu: "CVU" };

/** Nombre del titular: entre 2 y 80 caracteres, sin saltos de línea. */
export function parseHolderName(input: string): string | null {
  const name = input.replace(/\s+/g, " ").trim();
  return name.length >= 2 && name.length <= 80 ? name : null;
}
