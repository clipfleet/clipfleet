import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, staticSecurityHeaders } from "./headers";

describe("Content-Security-Policy", () => {
  const prod = contentSecurityPolicy("abc123", false);

  it("en producción los scripts solo corren con nonce: sin unsafe-inline ni unsafe-eval", () => {
    const scriptSrc = prod.split("; ").find((directive) => directive.startsWith("script-src"))!;
    expect(scriptSrc).toContain("'nonce-abc123'");
    expect(scriptSrc).not.toContain("unsafe-inline");
    expect(scriptSrc).not.toContain("unsafe-eval");
  });

  it("bloquea marcos, plugins, cambio de base y envíos de formularios a otros sitios", () => {
    for (const directive of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]) {
      expect(prod).toContain(directive);
    }
  });

  it("unsafe-eval solo existe en desarrollo", () => {
    expect(contentSecurityPolicy("abc123", true)).toContain("unsafe-eval");
  });
});

describe("encabezados fijos", () => {
  it("producción lleva HSTS y, mientras no se habilite, noindex", () => {
    const keys = staticSecurityHeaders({ isProd: true, allowIndexing: false }).map((header) => header.key);
    expect(keys).toEqual(expect.arrayContaining(["Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "X-Robots-Tag"]));
  });

  it("con indexación habilitada no manda noindex", () => {
    const keys = staticSecurityHeaders({ isProd: true, allowIndexing: true }).map((header) => header.key);
    expect(keys).not.toContain("X-Robots-Tag");
  });
});
