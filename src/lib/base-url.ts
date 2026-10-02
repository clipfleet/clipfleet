import { headers } from "next/headers";

/** URL pública de la app: `APP_URL` si está configurada, o la del request actual. */
export async function baseUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}
