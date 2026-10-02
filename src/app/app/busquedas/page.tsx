import Link from "next/link";
import { payRuleText } from "@/components/domain/pay-rule-summary";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatShortDate } from "@/components/ui/format";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { JOB_STATUS } from "@/lib/domain/labels";
import { listMyJobs } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Búsquedas" };

export default async function MyJobsPage() {
  const me = await requireUser("hirer");
  const jobs = await listMyJobs(me.id);

  return (
    <>
      <PageHeader
        title="Búsquedas"
        actions={<ButtonLink href="/app/busquedas/nueva">Publicar búsqueda</ButtonLink>}
      />

      {jobs.length === 0 ? (
        <EmptyState
          title="Todavía no publicaste ninguna búsqueda"
          action={<ButtonLink href="/app/busquedas/nueva">Publicar búsqueda</ButtonLink>}
        />
      ) : (
        <Panel padded={false}>
          <Table caption="Mis búsquedas" layout="stack" minWidth={760}>
            <THead>
              <TR>
                <TH width="36%">Búsqueda</TH>
                <TH>Estado</TH>
                <TH>Pago</TH>
                <TH numeric>Contratados</TH>
                <TH numeric>Sin responder</TH>
              </TR>
            </THead>
            <TBody>
              {jobs.map((job) => (
                <TR key={job.id} tone={job.status === "closed" ? "muted" : "default"}>
                  <TH scope="row">
                    <Link href={`/app/busquedas/${job.id}`} className="link-row">
                      {job.title}
                    </Link>
                    <span className="block text-[0.8125rem] font-normal text-ink-3">Publicada el {formatShortDate(job.createdAt)}</span>
                  </TH>
                  <TD label="Estado">
                    <Badge tone={JOB_STATUS[job.status].tone}>{JOB_STATUS[job.status].label}</Badge>
                  </TD>
                  <TD label="Pago" className="text-ink-2 tabular-nums">
                    {payRuleText(job.payRule)}
                  </TD>
                  <TD label="Contratados" numeric>
                    {job.hired}/{job.slots}
                  </TD>
                  <TD label="Sin responder" numeric>
                    {job.pending > 0 ? <Badge tone="warning">{job.pending}</Badge> : <span className="text-ink-3">0</span>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Panel>
      )}
    </>
  );
}
