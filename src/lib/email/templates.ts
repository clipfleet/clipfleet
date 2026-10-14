import { BRAND } from "@/lib/brand";
import type { Email } from "./index";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Email con el link para elegir una contraseña nueva. */
export function resetPasswordEmail(to: string, url: string, minutes: number): Email {
  const subject = `Restablecé tu contraseña de ${BRAND.name}`;
  const text = [
    `Pediste restablecer tu contraseña de ${BRAND.name}.`,
    "",
    `Entrá a este link para elegir una nueva (vence en ${minutes} minutos):`,
    url,
    "",
    "Si no lo pediste, ignorá este email: tu contraseña no cambia.",
  ].join("\n");
  const href = escapeHtml(url);
  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f6f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5">Pediste restablecer tu contraseña de ${escapeHtml(BRAND.name)}.</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5">Entrá a este link para elegir una nueva. Vence en ${minutes} minutos.</p>
      <p style="margin:0 0 24px"><a href="${href}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px">Elegir contraseña nueva</a></p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#666666">Si el botón no anda, copiá este link:</p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.5;word-break:break-all"><a href="${href}" style="color:#666666">${href}</a></p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#666666">Si no lo pediste, ignorá este email: tu contraseña no cambia.</p>
    </div>
  </body>
</html>`;
  return { to, subject, text, html };
}
