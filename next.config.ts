import type { NextConfig } from "next";
import { staticSecurityHeaders } from "./src/lib/security/headers";

const isProd = process.env.NODE_ENV === "production";
// Mientras el sitio está en desarrollo no se indexa. Para abrirlo a buscadores: ALLOW_INDEXING=1.
const allowIndexing = process.env.ALLOW_INDEXING === "1";

const nextConfig: NextConfig = {
  // PGlite carga su binario WASM desde node_modules; no hay que empaquetarlo.
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: staticSecurityHeaders({ isProd, allowIndexing }) }];
  },
};

export default nextConfig;
