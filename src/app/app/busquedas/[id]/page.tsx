import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { payRuleText } from "@/components/domain/pay-rule-summary";
import { PlatformTag } from "@/components/domain/platform";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Num } from "@/components/ui/num";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { decideApplication, setJobStatus } from "@/lib/actions/jobs";
import { APPLICATION_STATUS, JOB_STATUS } from "@/lib/domain/labels";
import { getMyJob } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Campaña" };

/** A partir de este largo la descripción se pliega a dos líneas con "Ver más". */
const LONG_DESCRIPTION = 160;

export default async function MyJobPage({ params }: PageProps<"/app/busquedas/[id]">) {
  const me = await requireUser("hirer");
  const { id } = await params;
  const data = await getMyJob(me.id, id);
  if (!data) notFound();
  const { job, applications, hired } = data;
  const pending = applications.filter((application) => application.status === "pending").length;

  return (
    <>
      <PageHeader
        back={{ href: "/app/busquedas", label: "Campañas" }}
        title={job.title}
        meta={
          <>
            <Badge tone={JOB_STATUS[job.status].tone}>{JOB_STATUS[job.status].label}</Badge>
            <PlatformTag platform={job.platform} name={job.platformName} />
            <span className="tabular-nums">{payRuleText(job.payRule)}</span>
            <span className="tabular-nums">
              Contratados {hired} de {job.slots}
            </span>
            <Link href={`/trabajos/${job.id}`} className="link">
              Ver página pública
            </Link>
          </>
        }
        actions={
          <>
            <ActionForm action={setJobStatus} feedback="inline" className="flex flex-col items-start gap-1.5 sm:items-end">
              <input type="hidden" name="jobId" value={job.id} />
              {job.status === "open" ? (
                <FormSubmit variant="secondary" name="status" value="paused">
                  Pausar
                </FormSubmit>
              ) : (
                <FormSubmit variant="secondary" name="status" value="open">
                  Reabrir
                </FormSubmit>
              )}
            </ActionForm>
          </>
        }
      />

      {job.description.length <= LONG_DESCRIPTION ? (
        <p className="max-w-prose text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-ink-2">{job.description}</p>
      ) : (
        <details className="group max-w-prose text-[0.9375rem] leading-relaxed text-ink-2">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="line-clamp-2 whitespace-pre-wrap group-open:line-clamp-none">{job.description}</span>
            <span className="link text-sm group-open:hidden">Ver más</span>
            <span className="link hidden text-sm group-open:inline">Ver menos</span>
          </summary>
        </details>
      )}

      <section aria-labelledby="postulaciones" className="flex flex-col gap-3">
        <h2 id="postulaciones" className="type-title flex flex-wrap items-center gap-2 text-[1.0625rem]">
          Postulaciones
          {pending > 0 ? <Badge tone="warning">{pending} sin responder</Badge> : null}
        </h2>
        <Panel padded={false}>
        {applications.length === 0 ? (
          <EmptyState flush title="Todavía no se postuló nadie" />
        ) : (
          <Table caption="Postulaciones a la campaña" layout="stack" minWidth={640}>
            <THead>
              <TR>
                <TH>Persona</TH>
                <TH numeric>Vistas</TH>
                <TH numeric>Videos</TH>
                <TH width="16rem">
                  <span className="sr-only">Respuesta</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {applications.map((application) => (
                <TR key={application.id}>
                  <TH scope="row">
                    <Link href={`/t/${application.worker.username}`} className="link-row">
                      {application.worker.name}
                    </Link>
                    {application.message ? <span className="mt-0.5 block max-w-prose text-[0.8125rem] font-normal text-ink-2">“{application.message}”</span> : null}
                  </TH>
                  <TD label="Vistas" numeric>
                    <Num value={application.stats.totalViews > 0 ? application.stats.totalViews : null} />
                  </TD>
                  <TD label="Videos" numeric>
                    <Num value={application.stats.approvedDeliverables > 0 ? application.stats.approvedDeliverables : null} compact={false} />
                  </TD>
                  <TD actions align="right">
                    {application.status === "pending" ? (
                      <ActionForm action={decideApplication} feedback="inline" className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <input type="hidden" name="applicationId" value={application.id} />
                        <FormSubmit size="sm" name="decision" value="accepted">
                          Contratar
                        </FormSubmit>
                        <FormSubmit size="sm" variant="ghost" name="decision" value="rejected">
                          Descartar
                        </FormSubmit>
                      </ActionForm>
                    ) : application.contractId ? (
                      <Link href={`/app/equipo/${application.contractId}`} className="link">
                        Ver contratación
                      </Link>
                    ) : (
                      <Badge tone={APPLICATION_STATUS[application.status].tone}>{APPLICATION_STATUS[application.status].label}</Badge>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        </Panel>
      </section>
    </>
  );
}
