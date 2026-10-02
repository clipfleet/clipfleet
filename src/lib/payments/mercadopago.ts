import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "./index";

const API = "https://api.mercadopago.com";

function token(): string {
  const value = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!value) throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN");
  return value;
}

/** Valida la firma `x-signature` de la notificación cuando hay secreto configurado. */
function signatureIsValid(request: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true;
  const signature = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const parts = new Map(signature.split(",").map((part) => part.trim().split("=") as [string, string]));
  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Depósitos con Checkout Pro de Mercado Pago (pesos argentinos). */
export const mercadoPagoProvider: PaymentProvider = {
  name: "mercadopago",

  async createDeposit({ depositId, amount, description, baseUrl }) {
    const back = `${baseUrl}/app/saldo`;
    const response = await fetch(`${API}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": depositId,
      },
      body: JSON.stringify({
        items: [{ id: depositId, title: description, quantity: 1, unit_price: amount / 100, currency_id: "ARS" }],
        external_reference: depositId,
        back_urls: { success: back, pending: back, failure: back },
        // Mercado Pago solo acepta retorno automático hacia URLs https.
        ...(baseUrl.startsWith("https://") ? { auto_return: "approved" } : {}),
        notification_url: `${baseUrl}/api/payments/webhook`,
      }),
    });
    if (!response.ok) throw new Error(`Mercado Pago rechazó la preferencia (${response.status})`);
    const preference = (await response.json()) as { id: string; init_point: string };
    return { checkoutUrl: preference.init_point, providerRef: preference.id };
  },

  async parseWebhook(request) {
    const url = new URL(request.url);
    const body = (await request.json().catch(() => null)) as { type?: string; data?: { id?: string | number } } | null;
    const type = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
    const dataId = String(body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
    if (type !== "payment" || !dataId) return null;
    if (!signatureIsValid(request, dataId)) throw new Error("Firma de webhook inválida");

    // La notificación solo avisa: el estado real se consulta a la API con nuestro token.
    const response = await fetch(`${API}/v1/payments/${encodeURIComponent(dataId)}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!response.ok) throw new Error(`No se pudo consultar el pago (${response.status})`);
    const payment = (await response.json()) as {
      status: string;
      currency_id: string;
      transaction_amount: number;
      external_reference: string | null;
    };
    if (payment.status !== "approved" || payment.currency_id !== "ARS" || !payment.external_reference) return null;
    return {
      depositId: payment.external_reference,
      providerRef: dataId,
      amount: Math.round(payment.transaction_amount * 100),
    };
  },
};
