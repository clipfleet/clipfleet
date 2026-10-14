import { BRAND } from "@/lib/brand";

export type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const RESEND_URL = "https://api.resend.com/emails";

/**
 * Remitente con el nombre de `BRAND` y la dirección de `EMAIL_FROM`, que puede venir sola
 * (`no-reply@mail.clipfleet.app`) o con nombre (`ClipFleet <no-reply@…>`).
 */
export function fromHeader(emailFrom: string | undefined): string | null {
  const raw = emailFrom?.trim() ?? "";
  const address = (raw.match(/<([^<>\s]+@[^<>\s]+)>/)?.[1] ?? raw).trim();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address)) return null;
  return `${BRAND.name} <${address}>`;
}

/**
 * Manda un email por Resend. Sin `RESEND_API_KEY` en desarrollo lo imprime en la terminal,
 * así los links se pueden probar sin mandar nada; en producción, que falte es un error.
 */
export async function sendEmail(email: Email, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (env.NODE_ENV === "production") throw new Error("Falta RESEND_API_KEY: no se pueden mandar emails.");
    console.info(`\n[email] Para: ${email.to}\n[email] Asunto: ${email.subject}\n\n${email.text}\n`);
    return;
  }

  const from = fromHeader(env.EMAIL_FROM);
  if (!from) throw new Error("EMAIL_FROM falta o no es una dirección válida.");

  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email.to],
      reply_to: BRAND.contactEmail,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });
  if (!response.ok) {
    // El cuerpo trae el motivo (dominio sin verificar, clave inválida…), nunca la clave.
    throw new Error(`Resend respondió ${response.status}: ${await response.text()}`);
  }
}
