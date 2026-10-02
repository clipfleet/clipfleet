import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { haveIBeenPwned } from "better-auth/plugins";
import { getDb } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema";

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

const isProd = process.env.NODE_ENV === "production";

/**
 * URL fija solo en producción. En desarrollo y en las vistas previas el origen se toma de
 * cada request, así la app anda desde cualquier dirección sin aflojar la verificación.
 */
function productionUrl(): string | undefined {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return undefined;
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return undefined;
}

function createAuth() {
  const baseURL = productionUrl();
  return betterAuth({
    ...(baseURL ? { baseURL } : {}),
    database: drizzleAdapter(getDb(), { provider: "pg", schema: { user, session, account, verification } }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: MAX_PASSWORD_LENGTH,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        // El rol nunca viene del cliente: el registro lo fija después de crear el usuario.
        role: { type: "string", required: true, input: false, defaultValue: "worker" },
        username: { type: "string", required: true, input: true, unique: true },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // una semana
      updateAge: 60 * 60 * 24, // se renueva una vez por día de uso
    },
    advanced: {
      cookiePrefix: "cliperia",
      useSecureCookies: isProd,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: isProd },
    },
    telemetry: { enabled: false },
    plugins: [
      // Rechaza contraseñas que figuran en filtraciones conocidas. Solo viajan los primeros
      // 5 caracteres de su hash SHA-1 (k-anonimato), nunca la contraseña.
      haveIBeenPwned({ customPasswordCompromisedMessage: "PASSWORD_COMPROMISED" }),
      nextCookies(),
    ],
  });
}

const globalRef = globalThis as unknown as { __cliperiaAuth?: ReturnType<typeof createAuth> };

/**
 * La autenticación se usa solo desde Server Actions (`getAuth().api.*`). No se monta el handler
 * HTTP de better-auth: así nadie puede registrarse o probar contraseñas salteando las
 * validaciones y los límites de intentos de los formularios.
 */
export function getAuth() {
  return (globalRef.__cliperiaAuth ??= createAuth());
}
