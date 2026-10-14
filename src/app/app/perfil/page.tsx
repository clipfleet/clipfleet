import type { ReactNode } from "react";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { Editable, EditTrigger, SectionCancel, SettingRow, SettingsGroup } from "@/components/forms/editable-section";
import { BADGE_ICON } from "@/components/domain/badge-list";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { changePassword } from "@/lib/actions/auth";
import { updateHirerProfile, updatePayeeDetails, updatePayerHolder, updateWorkerProfile } from "@/lib/actions/profile";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { getMyPaymentDetails, getProfiles, getWorkerActivity } from "@/lib/queries";
import { requireUser, type SessionUser } from "@/lib/session";

export const metadata = { title: "Perfil" };

/** Botones de un formulario que se edita en el lugar: guardar y cancelar. */
function SaveButtons({ children = "Guardar", pendingLabel = "Guardando…" }: { children?: string; pendingLabel?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <FormSubmit pendingLabel={pendingLabel}>{children}</FormSubmit>
      <SectionCancel />
    </div>
  );
}

/**
 * Quién es: lo primero y lo más grande de la página. Al editar, el encabezado
 * se convierte en el formulario.
 */
function Identity({ me, subtitle, actions, form }: { me: SessionUser; subtitle: ReactNode; actions?: ReactNode; form: ReactNode }) {
  return (
    <Editable
      className="sm:pb-3"
      view={
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={me.name} size="lg" />
            <div className="min-w-0">
              <h1 className="text-[1.75rem] leading-9 font-semibold tracking-[-0.025em] break-words">{me.name}</h1>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[0.9375rem] text-ink-2">
                {subtitle ? <span>{subtitle}</span> : null}
                <span className="text-sm text-ink-3">@{me.username}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions}
            <EditTrigger size="md">Editar perfil</EditTrigger>
          </div>
        </header>
      }
    >
      <div className="flex flex-col gap-4">
        <h1 className="type-page">Editar perfil</h1>
        <Panel className="max-w-form">{form}</Panel>
      </div>
    </Editable>
  );
}

/** Email y usuario no se cambian desde acá; la contraseña sí. */
function AccountGroup({ me }: { me: SessionUser }) {
  return (
    <SettingsGroup title="Cuenta">
      <SettingRow label="Email" value={me.email} />
      <SettingRow label="Contraseña" value="••••••••••" editLabel="Cambiar">
        <ActionForm action={changePassword} className="flex max-w-form flex-col gap-5">
          <Field label="Contraseña actual">
            <Input name="currentPassword" type="password" required autoComplete="current-password" />
          </Field>
          <Field label="Contraseña nueva" hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`}>
            <Input name="newPassword" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
          </Field>
          <Field label="Repetí la contraseña nueva">
            <Input name="confirmPassword" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
          </Field>
          <SaveButtons pendingLabel="Cambiando…">Cambiar contraseña</SaveButtons>
        </ActionForm>
      </SettingRow>
    </SettingsGroup>
  );
}

export default async function ProfilePage() {
  const me = await requireUser();
  const [profiles, payment] = await Promise.all([getProfiles(me.id), getMyPaymentDetails(me.id)]);

  if (me.role === "hirer") {
    const profile = profiles.hirer;
    return (
      <>
        <Identity
          me={me}
          subtitle={profile?.brandName}
          form={
            <ActionForm action={updateHirerProfile} className="flex flex-col gap-5">
              <Field label="Tu nombre">
                <Input name="name" required defaultValue={me.name} autoComplete="name" />
              </Field>
              <Field label="Canal o marca" hint="Con este nombre aparecen tus campañas.">
                <Input name="brandName" required defaultValue={profile?.brandName ?? ""} />
              </Field>
              <SaveButtons />
            </ActionForm>
          }
        />

        <div className="flex max-w-3xl flex-col gap-8">
          <SettingsGroup title="Pagos">
            <SettingRow
              label="Pagás desde la cuenta de"
              value={payment?.holderName}
              note="Quien cobra ve este nombre para reconocer tu transferencia."
              editLabel={payment?.holderName ? "Cambiar" : "Completar"}
            >
              <ActionForm action={updatePayerHolder} className="flex max-w-form flex-col gap-5">
                <Field label="Titular de la cuenta desde la que pagás">
                  <Input name="holderName" required maxLength={80} defaultValue={payment?.holderName ?? ""} autoComplete="off" />
                </Field>
                <SaveButtons />
              </ActionForm>
            </SettingRow>
          </SettingsGroup>

          <AccountGroup me={me} />
        </div>
      </>
    );
  }

  const profile = profiles.worker;
  const { next } = await getWorkerActivity(me.id);
  return (
    <>
      <Identity
        me={me}
        subtitle={profile?.headline}
        actions={
          <ButtonLink href={`/app/talento/${me.username}`} variant="secondary">
            Ver mi perfil
          </ButtonLink>
        }
        form={
          <ActionForm action={updateWorkerProfile} className="flex flex-col gap-5">
            <Field label="Tu nombre">
              <Input name="name" required defaultValue={me.name} autoComplete="name" />
            </Field>
            <Field label="Presentación" optional hint="Una línea. Tus números se calculan solos.">
              <Input name="headline" maxLength={120} defaultValue={profile?.headline ?? ""} />
            </Field>
            <SaveButtons />
          </ActionForm>
        }
      />

      <div className="flex max-w-3xl flex-col gap-8">
        {next ? (
          <Panel title="Tu próxima insignia">
            <div className="flex flex-col gap-3">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
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

        <SettingsGroup title="Cobros">
          <SettingRow
            label="Cobrás en"
            value={
              payment?.account ? (
                <>
                  <span className="font-mono text-[0.8125rem]">{payment.account}</span>
                  <span className="text-ink-3"> · {payment.holderName}</span>
                </>
              ) : null
            }
            note="Solo lo ve quien te contrata, al momento de pagarte."
            editLabel={payment?.account ? "Cambiar" : "Completar"}
          >
            <ActionForm action={updatePayeeDetails} className="flex max-w-form flex-col gap-5">
              <Field label="Titular de la cuenta" hint="Como figura en tu banco o billetera.">
                <Input name="holderName" required maxLength={80} defaultValue={payment?.holderName ?? ""} autoComplete="off" />
              </Field>
              <Field label="Alias, CBU o CVU">
                <Input name="account" required maxLength={40} defaultValue={payment?.account ?? ""} autoComplete="off" autoCapitalize="none" spellCheck={false} />
              </Field>
              <Field label="Tu contraseña" hint="Te la pedimos para que nadie más pueda cambiar a dónde cobrás.">
                <Input name="currentPassword" type="password" required autoComplete="current-password" />
              </Field>
              <SaveButtons />
            </ActionForm>
          </SettingRow>
        </SettingsGroup>

        <AccountGroup me={me} />
      </div>
    </>
  );
}
