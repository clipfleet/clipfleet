import type { Platform } from "@/lib/domain/categories";

/**
 * Fuente de vistas de un video. En el MVP las vistas las reporta el trabajador y las
 * aprueba el contratador (`manual`); una fuente automática implementa esta interfaz.
 */
export interface ViewSource {
  readonly name: "manual" | "api";
  supports(url: string): boolean;
  fetchViews(url: string): Promise<{ views: number; capturedAt: Date }>;
}

/** No hay fuentes automáticas todavía. TikTok e Instagram no exponen vistas de terceros por API pública. */
export const viewSources: ViewSource[] = [];

export function automaticSourceFor(url: string): ViewSource | null {
  return viewSources.find((source) => source.supports(url)) ?? null;
}

export function detectPlatform(url: string): Platform {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "otra";
  }
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "youtube";
  return "otra";
}
