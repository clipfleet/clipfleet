import { headers } from "next/headers";
import { db } from "@/lib/db";
import { hit } from "./rate-limit";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Límites por acción: [intentos, ventana en segundos]. */
export const LIMITS = {
  signInByIp: [20, 15 * MINUTE],
  signInByEmail: [8, 15 * MINUTE],
  signUpByIp: [5, HOUR],
  createJob: [20, DAY],
  createInvites: [20, HOUR],
  applyToJob: [40, HOUR],
  submitDeliverable: [300, HOUR],
  reportViews: [600, HOUR],
  sendMessage: [120, HOUR],
  leaveReview: [20, HOUR],
  updateProfile: [30, HOUR],
  // Pide la contraseña actual: el límite también frena que se la adivinen desde una sesión robada.
  updatePaymentDetails: [5, HOUR],
  manage: [600, HOUR],
} as const satisfies Record<string, readonly [number, number]>;

/** IP del cliente. En Vercel la plataforma pisa estos encabezados, así que no se pueden falsificar. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
}

/**
 * Cuenta un intento de `action` para `subject` (un id de usuario, una IP, un email).
 * Devuelve el error para mostrar si se pasó del límite, o null si puede seguir.
 */
export async function tooMany(action: keyof typeof LIMITS, subject: string): Promise<{ error: string } | null> {
  const [limit, windowSeconds] = LIMITS[action];
  const result = await hit(db, `${action}:${subject}`, limit, windowSeconds);
  if (result.allowed) return null;
  const minutes = Math.ceil(result.retryAfterSeconds / 60);
  return {
    error: `Demasiados intentos. Probá de nuevo en ${minutes === 1 ? "un minuto" : `${minutes} minutos`}.`,
  };
}
