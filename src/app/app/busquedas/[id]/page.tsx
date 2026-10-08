import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { payRuleText } from "@/components/domain/pay-rule-summary";
import { PlatformTag } from "@/components/domain/platform";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Num } from "@/components/ui/num";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { decideApplication, setJobStatus } from "@/lib/actions/jobs";
import { APPLICATION_STATUS, JOB_STATUS } from "@/lib/domain/labels";
import { getMyJob } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Búsqueda" };

export default async function MyJobPage({ params }: PageProps<"/app/busquedas/[id]">) {
  const me = await requireUser("hirer");
  const { id } = await params;
  const data = await getMyJob(me.id, id);
  if (!data) notFound();
  const { job, applications } = data;

  return (
    <>
      <PageHeader
        back={{ href: "/app/busquedas", label: "Búsquedas" }}
        title={job.title}
        meta={
          <>
            <Badge tone={JOB_STATUS[job.status].tone}>{JOB_STATUS[job.status].label}</Badge>
            <PlatformTag platform={job.platform} name={job.platformName} />
            <span className="tabular-nums">{payRuleText(job.payRule)}</span>
          </>
        }
        actions={
          <>
            <ButtonLink href={`/trabajos/${job.id}`} variant="secondary">
              Ver publicación
            </ButtonLink>
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

      <Panel title="Postulaciones" padded={false}>
        {applications.length === 0 ? (
          <EmptyState flush title="Todavía no se postuló nadie" />
        ) : (
          <Table caption="Postulaciones a la búsqueda" layout="stack" minWidth={640}>
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
    </>
  );
}
