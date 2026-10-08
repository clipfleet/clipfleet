import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { updateHirerProfile, updatePayeeDetails, updatePayerHolder, updateWorkerProfile } from "@/lib/actions/profile";
import { getMyPaymentDetails, getProfiles } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const me = await requireUser();
  const [profiles, payment] = await Promise.all([getProfiles(me.id), getMyPaymentDetails(me.id)]);

  if (me.role === "hirer") {
    const profile = profiles.hirer;
    return (
      <>
        <PageHeader title="Perfil" />
        <Panel className="max-w-form">
          <ActionForm action={updateHirerProfile} className="flex flex-col gap-5">
            <Field label="Tu nombre">
              <Input name="name" required defaultValue={me.name} autoComplete="name" />
            </Field>
            <Field label="Canal o marca" hint="Con este nombre aparecen tus búsquedas.">
              <Input name="brandName" required defaultValue={profile?.brandName ?? ""} />
            </Field>
            <div>
              <FormSubmit pendingLabel="Guardando…">Guardar perfil</FormSubmit>
            </div>
          </ActionForm>
        </Panel>

        <Panel title="Pagos" description="Quien cobra ve este nombre para reconocer tu transferencia." className="max-w-form">
          <ActionForm action={updatePayerHolder} className="flex flex-col gap-5">
            <Field label="Titular de la cuenta desde la que pagás">
              <Input name="holderName" required maxLength={80} defaultValue={payment?.holderName ?? ""} autoComplete="off" />
            </Field>
            <div>
              <FormSubmit pendingLabel="Guardando…">Guardar titular</FormSubmit>
            </div>
          </ActionForm>
        </Panel>
      </>
    );
  }

  const profile = profiles.worker;
  return (
    <>
      <PageHeader
        title="Perfil"
        actions={
          <ButtonLink href={`/t/${me.username}`} variant="secondary">
            Ver mi perfil público
          </ButtonLink>
        }
      />
      <Panel className="max-w-form">
        <ActionForm action={updateWorkerProfile} className="flex flex-col gap-5">
          <Field label="Tu nombre">
            <Input name="name" required defaultValue={me.name} autoComplete="name" />
          </Field>
          <Field label="Presentación" optional hint="Una línea. Tus números se calculan solos.">
            <Input name="headline" maxLength={120} defaultValue={profile?.headline ?? ""} />
          </Field>
          <div>
            <FormSubmit pendingLabel="Guardando…">Guardar perfil</FormSubmit>
          </div>
        </ActionForm>
      </Panel>

      <Panel title="Datos de cobro" description="Solo los ve quien te contrata, al momento de pagarte." className="max-w-form">
        <ActionForm action={updatePayeeDetails} className="flex flex-col gap-5">
          <Field label="Titular de la cuenta" hint="Como figura en tu banco o billetera.">
            <Input name="holderName" required maxLength={80} defaultValue={payment?.holderName ?? ""} autoComplete="off" />
          </Field>
          <Field label="Alias, CBU o CVU">
            <Input name="account" required maxLength={40} defaultValue={payment?.account ?? ""} autoComplete="off" autoCapitalize="none" spellCheck={false} />
          </Field>
          <Field label="Tu contraseña" hint="Te la pedimos para que nadie más pueda cambiar a dónde cobrás.">
            <Input name="currentPassword" type="password" required autoComplete="current-password" />
          </Field>
          <div>
            <FormSubmit pendingLabel="Guardando…">Guardar datos de cobro</FormSubmit>
          </div>
        </ActionForm>
      </Panel>
    </>
  );
}
