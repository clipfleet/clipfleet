import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { DetailList, EditableSection, SectionCancel } from "@/components/forms/editable-section";
import { BADGE_ICON } from "@/components/domain/badge-list";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { changePassword } from "@/lib/actions/auth";
import { updateHirerProfile, updatePayeeDetails, updatePayerHolder, updateWorkerProfile } from "@/lib/actions/profile";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { getMyPaymentDetails, getProfiles, getWorkerActivity } from "@/lib/queries";
import { requireUser, type SessionUser } from "@/lib/session";

export const metadata = { title: "Perfil" };

/** Botones de un formulario dentro de una sección: guardar y cancelar. */
function SectionButtons({ children, pendingLabel = "Guardando…" }: { children: string; pendingLabel?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <FormSubmit pendingLabel={pendingLabel}>{children}</FormSubmit>
      <SectionCancel />
    </div>
  );
}

/** Email y usuario no se editan desde acá; la contraseña sí. */
function AccountSection({ me }: { me: SessionUser }) {
  return (
    <EditableSection
      title="Cuenta"
      editLabel="Cambiar contraseña"
      className="max-w-form"
      view={
        <DetailList
          items={[
            { label: "Email", value: me.email },
            { label: "Usuario", value: `@${me.username}` },
            { label: "Contraseña", value: "••••••••••" },
          ]}
        />
      }
    >
      <ActionForm action={changePassword} className="flex flex-col gap-5">
        <Field label="Contraseña actual">
          <Input name="currentPassword" type="password" required autoComplete="current-password" />
        </Field>
        <Field label="Contraseña nueva" hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`}>
          <Input name="newPassword" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
        </Field>
        <Field label="Repetí la contraseña nueva">
          <Input name="confirmPassword" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
        </Field>
        <SectionButtons pendingLabel="Cambiando…">Cambiar contraseña</SectionButtons>
      </ActionForm>
    </EditableSection>
  );
}

export default async function ProfilePage() {
  const me = await requireUser();
  const [profiles, payment] = await Promise.all([getProfiles(me.id), getMyPaymentDetails(me.id)]);

  if (me.role === "hirer") {
    const profile = profiles.hirer;
    return (
      <>
        <PageHeader title="Perfil" />

        <EditableSection
          title="Perfil"
          className="max-w-form"
          view={
            <DetailList
              items={[
                { label: "Nombre", value: me.name },
                { label: "Canal o marca", value: profile?.brandName },
              ]}
            />
          }
        >
          <ActionForm action={updateHirerProfile} className="flex flex-col gap-5">
            <Field label="Tu nombre">
              <Input name="name" required defaultValue={me.name} autoComplete="name" />
            </Field>
            <Field label="Canal o marca" hint="Con este nombre aparecen tus campañas.">
              <Input name="brandName" required defaultValue={profile?.brandName ?? ""} />
            </Field>
            <SectionButtons>Guardar</SectionButtons>
          </ActionForm>
        </EditableSection>

        <EditableSection
          title="Pagos"
          description="Quien cobra ve este nombre para reconocer tu transferencia."
          editLabel={payment?.holderName ? "Editar" : "Completar"}
          className="max-w-form"
          view={<DetailList items={[{ label: "Titular de la cuenta", value: payment?.holderName }]} />}
        >
          <ActionForm action={updatePayerHolder} className="flex flex-col gap-5">
            <Field label="Titular de la cuenta desde la que pagás">
              <Input name="holderName" required maxLength={80} defaultValue={payment?.holderName ?? ""} autoComplete="off" />
            </Field>
            <SectionButtons>Guardar</SectionButtons>
          </ActionForm>
        </EditableSection>

        <AccountSection me={me} />
      </>
    );
  }

  const profile = profiles.worker;
  const { next } = await getWorkerActivity(me.id);
  return (
    <>
      <PageHeader
        title="Perfil"
        actions={
          <ButtonLink href={`/app/talento/${me.username}`} variant="secondary">
            Ver mi perfil
          </ButtonLink>
        }
      />

      <EditableSection
        title="Perfil"
        className="max-w-form"
        view={
          <DetailList
            items={[
              { label: "Nombre", value: me.name },
              { label: "Presentación", value: profile?.headline },
            ]}
          />
        }
      >
        <ActionForm action={updateWorkerProfile} className="flex flex-col gap-5">
          <Field label="Tu nombre">
            <Input name="name" required defaultValue={me.name} autoComplete="name" />
          </Field>
          <Field label="Presentación" optional hint="Una línea. Tus números se calculan solos.">
            <Input name="headline" maxLength={120} defaultValue={profile?.headline ?? ""} />
          </Field>
          <SectionButtons>Guardar</SectionButtons>
        </ActionForm>
      </EditableSection>

      {next ? (
        <Panel title="Tu próxima insignia" className="max-w-form">
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 font-medium">
              <span className="text-accent">{BADGE_ICON[next.family]}</span>
              {next.label}
              <span className="font-normal text-ink-2">· te faltan {next.missing}</span>
            </p>
            <div
              role="progressbar"
              aria-label={`Avance hacia ${next.label}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.floor(next.progress * 100)}
              className="h-1.5 overflow-hidden rounded-full bg-wash-2"
            >
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.floor(next.progress * 100)}%` }} />
            </div>
          </div>
        </Panel>
      ) : null}

      <EditableSection
        title="Datos de cobro"
        description="Solo los ve quien te contrata, al momento de pagarte."
        editLabel={payment?.account ? "Editar" : "Completar"}
        className="max-w-form"
        view={
          <DetailList
            items={[
              { label: "Titular de la cuenta", value: payment?.holderName },
              { label: "Alias, CBU o CVU", value: payment?.account ? <span className="font-mono text-[0.8125rem]">{payment.account}</span> : null },
            ]}
          />
        }
      >
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
          <SectionButtons>Guardar</SectionButtons>
        </ActionForm>
      </EditableSection>

      <AccountSection me={me} />
    </>
  );
}
