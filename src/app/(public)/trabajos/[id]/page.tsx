import { notFound } from "next/navigation";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { PayRuleSummary } from "@/components/domain/pay-rule-summary";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { applyToJob } from "@/lib/actions/jobs";
import { APPLICATION_STATUS, JOB_STATUS } from "@/lib/domain/labels";
import { getJob, getMyApplication } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/trabajos/[id]">) {
  const { id } = await params;
  const job = await getJob(id);
  return { title: job?.title ?? "Trabajo" };
}

export default async function JobPage({ params }: PageProps<"/trabajos/[id]">) {
  const { id } = await params;
  const [job, me] = await Promise.all([getJob(id), getSessionUser()]);
  if (!job) notFound();
  const application = me?.role === "worker" ? await getMyApplication(job.id, me.id) : null;
  const open = job.status === "open";

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <PageHeader
        back={{ href: "/trabajos", label: "Trabajos" }}
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
            <Notice tone="info" title="Esta búsqueda ya no recibe postulaciones" />
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

        <Panel title="Cómo se paga">
          <PayRuleSummary {...job.payRule} />
        </Panel>
      </div>
    </div>
  );
}
