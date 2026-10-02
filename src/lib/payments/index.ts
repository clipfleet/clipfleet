import { mercadoPagoProvider } from "./mercadopago";
import { sandboxProvider } from "./sandbox";

export type ConfirmedDeposit = {
  depositId: string;
  providerRef: string;
  /** Monto efectivamente cobrado, en centavos. */
  amount: number;
};

/**
 * Proveedor de cobro para los depósitos del contratador. El resto del sistema no sabe
 * quién cobra: cambiar de proveedor es escribir otro adaptador y elegirlo acá.
 */
export interface PaymentProvider {
  readonly name: string;
  createDeposit(input: {
    depositId: string;
    amount: number;
    description: string;
    baseUrl: string;
  }): Promise<{ checkoutUrl: string; providerRef: string | null }>;
  /** Interpreta una notificación del proveedor. Devuelve null si no hay nada que acreditar. */
  parseWebhook(request: Request): Promise<ConfirmedDeposit | null>;
}

export function getPaymentProvider(): PaymentProvider | null {
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) return mercadoPagoProvider;
  // El checkout simulado acredita saldo sin cobrar: nunca en producción.
  if (process.env.NODE_ENV !== "production") return sandboxProvider;
  return null;
}
