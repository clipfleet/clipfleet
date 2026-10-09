import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { RadioCards } from "@/components/ui/radio-cards";
import { signUp } from "@/lib/actions/auth";
import { getSessionUser, homeFor } from "@/lib/session";

export const metadata = { title: "Registrarme" };

const HIDE_BRAND = `.sign-up:not(:has(input[name="role"][value="hirer"]:checked)) [data-only="hirer"]{display:none}`;

export default async function SignUpPage({ searchParams }: PageProps<"/registro">) {
  const me = await getSessionUser();
  if (me) redirect(homeFor(me.role));
  const { next, rol } = await searchParams;
  const nextPath = typeof next === "string" ? next : "";
  // Quien llega desde una invitación o una búsqueda viene a trabajar.
  const defaultRole = rol === "contratador" ? "hirer" : "worker";

  return (
    <div className="flex-1 bg-wash">
      <div className="mx-auto flex max-w-form flex-col gap-6 px-4 py-12 sm:py-16">
        <h1 className="type-page">Crear cuenta</h1>
        <Panel className="shadow-xs">
          <style>{HIDE_BRAND}</style>
          <ActionForm action={signUp} className="sign-up flex flex-col gap-5">
            <input type="hidden" name="next" value={nextPath} />
            <RadioCards
              name="role"
              legend="¿Para qué venís?"
              columns={2}
              defaultValue={defaultRole}
              required
              options={[
                { value: "worker", title: "Subo videos", description: "Gestiono multicuentas y cobro por vistas." },
                { value: "hirer", title: "Tengo contenido", description: "Busco quién lo suba y pago por resultados." },
              ]}
            />
            <Field label="Nombre y apellido">
              <Input name="name" required minLength={2} maxLength={80} autoComplete="name" />
            </Field>
            <div data-only="hirer">
              <Field label="Canal o marca" optional>
                <Input name="brandName" maxLength={80} />
              </Field>
            </div>
            <Field label="Usuario" hint="Minúsculas, números y guion bajo.">
              <Input name="username" required pattern="[a-z0-9_]{3,24}" autoCapitalize="none" autoComplete="username" leading="@" />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" />
            </Field>
            <Field label="Contraseña" hint="Al menos 10 caracteres.">
              <Input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" />
            </Field>
            <FormSubmit block pendingLabel="Creando cuenta…">
              Crear cuenta
            </FormSubmit>
            <p className="text-[0.8125rem] text-ink-3">
              Al crear tu cuenta aceptás la{" "}
              <Link href="/privacidad" className="link">
                Política de privacidad
              </Link>
              .
            </p>
          </ActionForm>
        </Panel>
        <p className="text-sm text-ink-2">
          ¿Ya tenés cuenta?{" "}
          <Link href={nextPath ? `/ingresar?next=${encodeURIComponent(nextPath)}` : "/ingresar"} className="rounded-sm font-medium text-accent hover:text-accent-hover">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  );
}
