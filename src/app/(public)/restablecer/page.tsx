import Link from "next/link";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { resetPassword } from "@/lib/actions/auth";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth";

export const metadata = { title: "Elegir contraseña nueva" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/restablecer">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";

  return (
    <div className="flex-1 bg-wash">
      <div className="mx-auto flex max-w-[25rem] flex-col gap-6 px-4 py-12 sm:py-20">
        <h1 className="type-page">Elegir contraseña nueva</h1>
        {value ? (
          <Panel className="shadow-xs">
            <ActionForm action={resetPassword} className="flex flex-col gap-4">
              <input type="hidden" name="token" value={value} />
              <Field label="Contraseña nueva" hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`}>
                <Input name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} autoComplete="new-password" />
              </Field>
              <Field label="Repetí la contraseña nueva">
                <Input name="confirmPassword" type="password" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} autoComplete="new-password" />
              </Field>
              <FormSubmit block pendingLabel="Guardando…">
                Guardar contraseña
              </FormSubmit>
            </ActionForm>
          </Panel>
        ) : (
          <Notice
            tone="error"
            title="Este link no sirve."
            action={
              <Link href="/recuperar" className="rounded-sm text-sm font-medium text-accent hover:text-accent-hover">
                Pedir otro
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
