export type PayoutSubmission = { status: "queued" } | { status: "sent"; ref: string };

/**
 * Cómo salen los retiros hacia el trabajador. Hoy los transfiere el equipo a mano;
 * automatizarlos es sumar otro proveedor acá, sin tocar el libro contable ni las pantallas.
 */
export interface PayoutProvider {
  readonly mode: "manual" | "auto";
  submit(withdrawal: { withdrawalId: string; amount: number; destination: string }): Promise<PayoutSubmission>;
}

/** Deja el retiro en la cola de `/admin/retiros`. */
const manualProvider: PayoutProvider = {
  mode: "manual",
  async submit() {
    return { status: "queued" };
  },
};

export function getPayoutProvider(mode: "manual" | "auto"): PayoutProvider {
  // Todavía no hay proveedor automático: aunque la configuración diga `auto`, el retiro
  // va a la cola manual para que nunca quede sin procesar.
  void mode;
  return manualProvider;
}
