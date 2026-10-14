"use server";

import { isPasswordCompromised } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { db, dbReady } from "@/lib/db";
import { hirerProfiles, user, workerProfiles } from "@/lib/db/schema";
import { clientIp, tooMany } from "@/lib/security/limits";
import { homeFor, requireUser } from "@/lib/session";
import { safeNext, text, type ActionResult } from "./result";

const USERNAME = /^[a-z0-9_]{3,24}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function password(form: FormData): string {
  const value = form.get("password");
  return typeof value === "string" ? value : "";
}

/** Código de error de better-auth, si lo hay. */
function authErrorCode(error: unknown): string {
  const body = (error as { body?: { code?: string; message?: string } } | null)?.body;
  return `${body?.code ?? ""} ${body?.message ?? ""}`;
}

export async function signUp(form: FormData): Promise<ActionResult> {
  await dbReady();
  const limited = await tooMany("signUpByIp", await clientIp());
  if (limited) return limited;

  const role = form.get("role") === "hirer" ? "hirer" : "worker";
  const name = text(form, "name", 80);
  const email = text(form, "email", 200).toLowerCase();
  const username = text(form, "username", 24).toLowerCase();
  const pass = password(form);
  const brandName = text(form, "brandName", 80);

  if (name.length < 2) return { error: "Decinos tu nombre." };
  if (!EMAIL.test(email)) return { error: "Revisá el email." };
  if (!USERNAME.test(username)) {
    return { error: "El usuario tiene que tener entre 3 y 24 caracteres: letras minúsculas, números o guion bajo." };
  }
  if (pass.length < MIN_PASSWORD_LENGTH) return { error: `La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  if (pass.length > MAX_PASSWORD_LENGTH) return { error: `La contraseña no puede tener más de ${MAX_PASSWORD_LENGTH} caracteres.` };

  const [taken] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (taken) return { error: "Ese nombre de usuario ya está en uso." };

  let userId: string;
  try {
    const result = await getAuth().api.signUpEmail({
      body: { name, email, password: pass, username },
      headers: await headers(),
    });
    userId = result.user.id;
  } catch (error) {
    if (authErrorCode(error).includes("PASSWORD_COMPROMISED")) {
      return { error: "Esa contraseña aparece en filtraciones de datos conocidas. Elegí otra." };
    }
    // Mensaje único para cualquier otro caso: no confirma si el email ya tiene cuenta.
    return { error: "No pudimos crear la cuenta con esos datos. Si ya tenés una, ingresá." };
  }

  if (role === "hirer") {
    await db.update(user).set({ role: "hirer" }).where(eq(user.id, userId));
    await db.insert(hirerProfiles).values({ userId, brandName: brandName || name });
  } else {
    await db.insert(workerProfiles).values({ userId });
  }

  redirect(safeNext(text(form, "next")) ?? (role === "hirer" ? "/app/equipo" : "/app/perfil"));
}

export async function signIn(form: FormData): Promise<ActionResult> {
  await dbReady();
  const email = text(form, "email", 200).toLowerCase();
  const pass = password(form);

  // Dos límites: por IP (una máquina probando muchas cuentas) y por cuenta (muchas máquinas
  // probando una sola). Se cuentan antes de verificar la contraseña.
  const limited = (await tooMany("signInByIp", await clientIp())) ?? (await tooMany("signInByEmail", email));
  if (limited) return limited;

  if (!EMAIL.test(email) || pass.length === 0 || pass.length > MAX_PASSWORD_LENGTH) {
    return { error: "Email o contraseña incorrectos." };
  }
  try {
    await getAuth().api.signInEmail({ body: { email, password: pass }, headers: await headers() });
  } catch {
    return { error: "Email o contraseña incorrectos." };
  }
  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.email, email));
  redirect(safeNext(text(form, "next")) ?? homeFor(row?.role ?? "worker"));
}

export async function signOut(): Promise<void> {
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/");
}

/**
 * Cambia la contraseña con la sesión iniciada. Pide la actual y cierra las demás sesiones:
 * si alguien más tenía la cuenta abierta, queda afuera.
 */
export async function changePassword(form: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const limited = await tooMany("changePassword", me.id);
  if (limited) return limited;

  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  const currentPassword = field("currentPassword");
  const newPassword = field("newPassword");
  if (currentPassword.length === 0 || currentPassword.length > MAX_PASSWORD_LENGTH) return { error: "La contraseña actual no es correcta." };
  if (newPassword.length < MIN_PASSWORD_LENGTH) return { error: `La contraseña nueva tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  if (newPassword.length > MAX_PASSWORD_LENGTH) return { error: `La contraseña nueva no puede tener más de ${MAX_PASSWORD_LENGTH} caracteres.` };
  if (newPassword !== field("confirmPassword")) return { error: "Las dos contraseñas nuevas no coinciden." };
  if (newPassword === currentPassword) return { error: "La contraseña nueva tiene que ser distinta de la actual." };

  const requestHeaders = await headers();
  try {
    // `revokeOtherSessions` de better-auth también reemplaza la sesión actual, y la página que se
    // vuelve a dibujar después de la acción todavía lee la cookie vieja: te saca del panel. Por eso
    // se cambia la contraseña conservando esta sesión y después se cierran solo las demás.
    await getAuth().api.changePassword({ body: { currentPassword, newPassword }, headers: requestHeaders });
  } catch (error) {
    if (authErrorCode(error).includes("PASSWORD_COMPROMISED")) {
      return { error: "Esa contraseña aparece en filtraciones de datos conocidas. Elegí otra." };
    }
    return { error: "La contraseña actual no es correcta." };
  }
  await getAuth().api.revokeOtherSessions({ headers: requestHeaders });
  return { ok: "Contraseña cambiada. Cerramos la sesión en los demás dispositivos." };
}

/**
 * Pide el link para restablecer la contraseña. Responde lo mismo exista o no la cuenta:
 * el formulario no sirve para averiguar qué emails están registrados.
 */
export async function requestPasswordReset(form: FormData): Promise<ActionResult> {
  await dbReady();
  const email = text(form, "email", 200).toLowerCase();
  const limited = (await tooMany("passwordResetByIp", await clientIp())) ?? (await tooMany("passwordResetByEmail", email));
  if (limited) return limited;

  if (!EMAIL.test(email)) return { error: "Revisá el email." };
  try {
    await getAuth().api.requestPasswordReset({ body: { email }, headers: await headers() });
  } catch (error) {
    console.error("No se pudo pedir el link para restablecer la contraseña:", error);
  }
  return { ok: "Si hay una cuenta con ese email, te mandamos un link para elegir una contraseña nueva." };
}

/** Elige la contraseña nueva con el token del link. Cierra todas las sesiones de la cuenta. */
export async function resetPassword(form: FormData): Promise<ActionResult> {
  await dbReady();
  const limited = await tooMany("resetPasswordByIp", await clientIp());
  if (limited) return limited;

  const token = text(form, "token", 200);
  const newPassword = password(form);
  const expired = { error: "El link venció o ya se usó. Pedí uno nuevo." };
  if (!token) return expired;
  if (newPassword.length < MIN_PASSWORD_LENGTH) return { error: `La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  if (newPassword.length > MAX_PASSWORD_LENGTH) return { error: `La contraseña no puede tener más de ${MAX_PASSWORD_LENGTH} caracteres.` };
  const confirm = form.get("confirmPassword");
  if (newPassword !== (typeof confirm === "string" ? confirm : "")) return { error: "Las dos contraseñas no coinciden." };

  // better-auth gasta el token antes de revisar filtraciones: se revisa acá primero para que
  // una contraseña rechazada no inutilice el link.
  try {
    if (await isPasswordCompromised(newPassword)) {
      return { error: "Esa contraseña aparece en filtraciones de datos conocidas. Elegí otra." };
    }
  } catch {
    return { error: "No pudimos revisar la contraseña. Probá de nuevo en un rato." };
  }

  try {
    await getAuth().api.resetPassword({ body: { token, newPassword }, headers: await headers() });
  } catch (error) {
    if (authErrorCode(error).includes("PASSWORD_COMPROMISED")) {
      return { error: "Esa contraseña aparece en filtraciones de datos conocidas. Elegí otra." };
    }
    return expired;
  }
  redirect("/ingresar?restablecida=1");
}
