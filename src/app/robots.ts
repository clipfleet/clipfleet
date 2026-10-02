import type { MetadataRoute } from "next";

/** Mientras el sitio está en desarrollo no se indexa. Para abrirlo: ALLOW_INDEXING=1. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.ALLOW_INDEXING === "1") {
    return { rules: { userAgent: "*", allow: "/", disallow: ["/app/", "/invitacion/"] } };
  }
  return { rules: { userAgent: "*", disallow: "/" } };
}
