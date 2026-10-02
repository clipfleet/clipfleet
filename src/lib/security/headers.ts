/**
 * Content-Security-Policy. Los scripts solo corren si llevan el nonce de este request
 * (`strict-dynamic` extiende el permiso a lo que esos scripts carguen), así que un script
 * inyectado por un atacante no se ejecuta aunque logre colarse en el HTML.
 *
 * `style-src` admite estilos en línea porque los componentes posicionan cosas con el
 * atributo `style`; un estilo inyectado no ejecuta código.
 */
export function contentSecurityPolicy(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "manifest-src 'self'",
  ];
  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

/** Encabezados que valen para toda respuesta, también archivos estáticos. */
export function staticSecurityHeaders(options: { isProd: boolean; allowIndexing: boolean }): { key: string; value: string }[] {
  const list = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), browsing-topics=()",
    },
  ];
  if (options.isProd) {
    list.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
  }
  if (!options.allowIndexing) list.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
  return list;
}
