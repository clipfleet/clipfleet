import { BRAND } from "@/lib/brand";
import type { Email } from "./index";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Recuadro blanco centrado, con estilos en línea: los clientes de email ignoran las hojas de estilo. */
function layout(body: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f6f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">${body}
    </div>
  </body>
</html>`;
}

/** Botón con el link y, debajo, el link a la vista por si el botón no anda. `href` ya escapado. */
function button(href: string, label: string): string {
  return `<p style="margin:0 0 24px"><a href="${href}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px">${label}</a></p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#666666">Si el botón no anda, copiá este link:</p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.5;word-break:break-all"><a href="${href}" style="color:#666666">${href}</a></p>`;
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
  const html = layout(`
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5">Pediste restablecer tu contraseña de ${escapeHtml(BRAND.name)}.</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5">Entrá a este link para elegir una nueva. Vence en ${minutes} minutos.</p>
      ${button(href, "Elegir contraseña nueva")}
      <p style="margin:0;font-size:13px;line-height:1.5;color:#666666">Si no lo pediste, ignorá este email: tu contraseña no cambia.</p>`);
  return { to, subject, text, html };
}

/** Email con el link para verificar la dirección. */
export function verifyEmailEmail(to: string, url: string, hours: number): Email {
  const subject = `Verificá tu email en ${BRAND.name}`;
  const text = [
    `Para confirmar que este email es tuyo, entrá a este link (vence en ${hours} horas):`,
    url,
    "",
    `Si no creaste una cuenta en ${BRAND.name}, ignorá este email.`,
  ].join("\n");
  const href = escapeHtml(url);
  const html = layout(`
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5">Para confirmar que este email es tuyo, entrá a este link. Vence en ${hours} horas.</p>
      ${button(href, "Verificar email")}
      <p style="margin:0;font-size:13px;line-height:1.5;color:#666666">Si no creaste una cuenta en ${escapeHtml(BRAND.name)}, ignorá este email.</p>`);
  return { to, subject, text, html };
}
