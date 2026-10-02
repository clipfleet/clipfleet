import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from "@/lib/auth";
import { dbReady } from "@/lib/db";

export type Role = "hirer" | "worker" | "admin";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
};

/** Usuario de la sesión actual, o null. Se resuelve una sola vez por request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // `headers()` va primero: marca la página como dinámica antes de tocar la base.
  const requestHeaders = await headers();
  await dbReady();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const { id, name, email, username, role } = session.user;
  return { id, name, email, username, role: role as Role };
});

/** Exige sesión (y rol, si se indica). Usar en cada página y en cada Server Action. */
export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/ingresar");
  if (role && user.role !== role) redirect(homeFor(user.role));
  return user;
}

export function homeFor(role: Role): string {
  if (role === "hirer") return "/app/equipo";
  if (role === "worker") return "/app/contrataciones";
  return "/";
}
