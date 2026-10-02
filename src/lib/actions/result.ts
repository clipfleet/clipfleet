/** Lo que devuelve una Server Action a `ActionForm`. Si redirige, no devuelve nada. */
export type ActionResult = { error: string } | { ok: string } | undefined;

export function text(form: FormData, name: string, max = 5000): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Solo rutas internas: evita redirecciones abiertas con `?next=`. */
export function safeNext(value: string): string | null {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;
}

/**
 * Devuelve la URL solo si es http o https. Se usa al guardar un link y otra vez al
 * mostrarlo: un `javascript:` nunca llega a un `href`.
 */
export function httpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
