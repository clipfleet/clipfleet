import type { ReactNode } from "react";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { PayRuleSummary } from "@/components/domain/pay-rule-summary";
import { PlatformTag } from "@/components/domain/platform";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { applyToJob } from "@/lib/actions/jobs";
import { BRAND } from "@/lib/brand";
import { APPLICATION_STATUS, JOB_STATUS } from "@/lib/domain/labels";
import type { getJob, getMyApplication } from "@/lib/queries";
import type { SessionUser } from "@/lib/session";

export type JobDetailProps = {
  job: NonNullable<Awaited<ReturnType<typeof getJob>>>;
  me: SessionUser | null;
  application: Awaited<ReturnType<typeof getMyApplication>> | null;
  back: { href: string; label: string };
  /** Nota al lado del link para volver, p. ej. cuando el dueño ve su campaña. */
  backNote?: ReactNode;
  /** Acciones del encabezado, p. ej. "Copiar link" para el dueño. */
  actions?: ReactNode;
};

/** Una campaña como la ve quien sube videos. La usan la página pública y el panel. */
export function JobDetail({ job, me, application, back, backNote, actions }: JobDetailProps) {
  const open = job.status === "open";

  return (
    <>
      <PageHeader
        back={back}
        backNote={backNote}
        actions={actions}
        title={job.title}
        meta={
          <>
            {open ? null : <Badge tone={JOB_STATUS[job.status].tone}>{JOB_STATUS[job.status].label}</Badge>}
            <span>
              {job.hirer.brandName}
              {job.hirerConfirmedPayouts > 0 ? ` · ${job.hirerConfirmedPayouts} ${job.hirerConfirmedPayouts === 1 ? "pago confirmado" : "pagos confirmados"}` : null}
            </span>
          </>
        }
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          <p className="max-w-prose text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-ink-2">{job.description}</p>

          {!open ? (
            <Notice tone="info" title="Esta campaña ya no recibe postulaciones" />
          ) : !me ? (
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`/registro?next=/trabajos/${job.id}`}>Crear mi perfil y postularme</ButtonLink>
              <ButtonLink href={`/ingresar?next=/trabajos/${job.id}`} variant="secondary">
                Ya tengo cuenta
              </ButtonLink>
            </div>
          ) : me.role !== "worker" ? null : application ? (
            <Notice tone={application.status === "accepted" ? "success" : "info"} title={`Ya te postulaste: ${APPLICATION_STATUS[application.status].label.toLowerCase()}`} />
          ) : (
            <ActionForm action={applyToJob} className="flex max-w-form flex-col gap-4">
              <input type="hidden" name="jobId" value={job.id} />
              <Field label="Mensaje" optional hint="Tus números se adjuntan solos.">
                <Textarea name="message" rows={3} maxLength={2000} />
              </Field>
              <div>
                <FormSubmit pendingLabel="Enviando…">Postularme</FormSubmit>
              </div>
            </ActionForm>
          )}
        </div>

        <Panel
          title="Cómo se paga"
          footer={`Te paga ${job.hirer.brandName} directo. ${BRAND.name} no interviene en el pago ni lo garantiza.`}
          description={job.platform ? <>Por las vistas en <PlatformTag platform={job.platform} name={job.platformName} className="align-bottom font-medium text-ink-2" /></> : undefined}>
          <PayRuleSummary {...job.payRule} />
        </Panel>
      </div>
    </>
  );
}
