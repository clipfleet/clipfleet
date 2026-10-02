import type { PaymentProvider } from "./index";

/** Checkout simulado para desarrollo: una pantalla propia con un botón que aprueba el pago. */
export const sandboxProvider: PaymentProvider = {
  name: "sandbox",
  async createDeposit({ depositId }) {
    return { checkoutUrl: `/sandbox/checkout/${depositId}`, providerRef: null };
  },
  async parseWebhook() {
    return null;
  },
};
