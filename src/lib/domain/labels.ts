type Tone = "neutral" | "positive" | "warning" | "negative" | "info";
type Label = { label: string; tone: Tone };

export const CONTRACT_STATUS: Record<"active" | "ended", Label> = {
  active: { label: "Activa", tone: "positive" },
  ended: { label: "Finalizada", tone: "neutral" },
};

export const JOB_STATUS: Record<"open" | "paused" | "closed", Label> = {
  open: { label: "Abierta", tone: "positive" },
  paused: { label: "Pausada", tone: "warning" },
  closed: { label: "Cerrada", tone: "neutral" },
};

export const APPLICATION_STATUS: Record<"pending" | "accepted" | "rejected", Label> = {
  pending: { label: "Sin responder", tone: "warning" },
  accepted: { label: "Aceptada", tone: "positive" },
  rejected: { label: "No avanzó", tone: "neutral" },
};

export const DELIVERABLE_STATUS: Record<"requested" | "submitted" | "approved" | "rejected", Label> = {
  requested: { label: "Pedido", tone: "info" },
  submitted: { label: "Para revisar", tone: "warning" },
  approved: { label: "Aprobado", tone: "positive" },
  rejected: { label: "Rechazado", tone: "negative" },
};

/** Estado de una liquidación tal como lo ven las dos partes. */
export function payoutStatus(payout: { status: "pending" | "released"; confirmedAt: Date | null }): Label {
  if (payout.status === "pending") return { label: "Por pagar", tone: "warning" };
  if (payout.confirmedAt) return { label: "Cobro confirmado", tone: "positive" };
  return { label: "Pago informado", tone: "info" };
}
