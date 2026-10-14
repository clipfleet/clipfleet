import Link from "next/link";
import { headers } from "next/headers";
import { Notice } from "@/components/ui/notice";
import { getAuth } from "@/lib/auth";
import { dbReady } from "@/lib/db";
import { getSessionUser, homeFor } from "@/lib/session";

export const metadata = { title: "Verificar email" };

type Outcome = "verified" | "expired" | "invalid";

/** Verifica el token del link. Volver a abrir un link ya usado no falla: el email sigue verificado. */
async function verify(token: string): Promise<Outcome> {
  if (!token) return "invalid";
  await dbReady();
  try {
    await getAuth().api.verifyEmail({ query: { token }, headers: await headers() });
    return "verified";
  } catch (error) {
    const code = (error as { body?: { code?: string } } | null)?.body?.code;
    return code === "TOKEN_EXPIRED" ? "expired" : "invalid";
  }
}

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verificar">) {
  const { token } = await searchParams;
  const outcome = await verify(typeof token === "string" ? token : "");
  const me = await getSessionUser();
  const next = me ? { href: homeFor(me.role), label: "Ir al panel" } : { href: "/ingresar", label: "Ingresar" };
  const link = (
    <Link href={next.href} className="rounded-sm text-sm font-medium text-accent hover:text-accent-hover">
      {next.label}
    </Link>
  );

  return (
    <div className="flex-1 bg-wash">
      <div className="mx-auto flex max-w-[25rem] flex-col gap-6 px-4 py-12 sm:py-20">
        <h1 className="type-page">Verificar email</h1>
        {outcome === "verified" ? (
          <Notice tone="success" title="Listo, verificaste tu email." action={link} />
        ) : me?.emailVerified ? (
          // Un link roto o vencido no importa si la sesión ya tiene el email verificado.
          <Notice tone="success" title="Tu email ya está verificado." action={link} />
        ) : (
          <Notice tone="error" title={outcome === "expired" ? "Este link venció." : "Este link no sirve."} action={link}>
            Pedí otro desde el aviso del panel.
          </Notice>
        )}
      </div>
    </div>
  );
}
