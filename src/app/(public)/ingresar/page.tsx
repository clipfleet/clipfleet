import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { signIn } from "@/lib/actions/auth";
import { getSessionUser, homeFor } from "@/lib/session";

export const metadata = { title: "Ingresar" };

export default async function SignInPage({ searchParams }: PageProps<"/ingresar">) {
  const me = await getSessionUser();
  if (me) redirect(homeFor(me.role));
  const { next, restablecida } = await searchParams;
  const nextPath = typeof next === "string" ? next : "";

  return (
    <div className="flex-1 bg-wash">
      <div className="mx-auto flex max-w-[25rem] flex-col gap-6 px-4 py-12 sm:py-20">
        <h1 className="type-page">Ingresar</h1>
        {restablecida ? <Notice tone="success" title="Listo, cambiaste tu contraseña. Ingresá con la nueva." /> : null}
        <Panel className="shadow-xs">
          <ActionForm action={signIn} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={nextPath} />
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" />
            </Field>
            <Field label="Contraseña">
              <Input name="password" type="password" required autoComplete="current-password" />
            </Field>
            <Link href="/recuperar" className="-mt-1 self-start rounded-sm text-sm font-medium text-accent hover:text-accent-hover">
              ¿Olvidaste tu contraseña?
            </Link>
            <FormSubmit block pendingLabel="Ingresando…">
              Ingresar
            </FormSubmit>
          </ActionForm>
        </Panel>
        <p className="text-sm text-ink-2">
          ¿No tenés cuenta?{" "}
          <Link href={nextPath ? `/registro?next=${encodeURIComponent(nextPath)}` : "/registro"} className="rounded-sm font-medium text-accent hover:text-accent-hover">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
