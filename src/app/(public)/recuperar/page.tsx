import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { requestPasswordReset } from "@/lib/actions/auth";
import { getSessionUser, homeFor } from "@/lib/session";

export const metadata = { title: "Recuperar contraseña" };

export default async function ForgotPasswordPage() {
  const me = await getSessionUser();
  if (me) redirect(homeFor(me.role));

  return (
    <div className="flex-1 bg-wash">
      <div className="mx-auto flex max-w-[25rem] flex-col gap-6 px-4 py-12 sm:py-20">
        <div className="flex flex-col gap-2">
          <h1 className="type-page">Recuperar contraseña</h1>
          <p className="text-sm text-ink-2">Te mandamos un link para elegir una nueva.</p>
        </div>
        <Panel className="shadow-xs">
          <ActionForm action={requestPasswordReset} className="flex flex-col gap-4">
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" />
            </Field>
            <FormSubmit block pendingLabel="Mandando…">
              Mandar link
            </FormSubmit>
          </ActionForm>
        </Panel>
        <p className="text-sm text-ink-2">
          ¿Te acordaste?{" "}
          <Link href="/ingresar" className="rounded-sm font-medium text-accent hover:text-accent-hover">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  );
}
