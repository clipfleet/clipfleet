import Link from "next/link";
import { payRuleText } from "@/components/domain/pay-rule-summary";
import { PlatformTag } from "@/components/domain/platform";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatShortDate } from "@/components/ui/format";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { APPLICATION_STATUS } from "@/lib/domain/labels";
import { listMyApplications } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Postulaciones" };

export default async function MyApplicationsPage() {
  const me = await requireUser("worker");
  const applications = await listMyApplications(me.id);

  return (
    <>
      <PageHeader
        title="Postulaciones"
        actions={
          applications.length > 0 ? (
            <ButtonLink href="/trabajos" variant="secondary">
              Ver trabajos
            </ButtonLink>
          ) : null
        }
      />

      {applications.length === 0 ? (
        <EmptyState
          title="Todavía no te postulaste a nada"
          action={<ButtonLink href="/trabajos">Ver trabajos</ButtonLink>}
        />
      ) : (
        <Panel padded={false}>
          <Table caption="Mis postulaciones" layout="stack" minWidth={640}>
            <THead>
              <TR>
                <TH>Búsqueda</TH>
                <TH>Pago</TH>
                <TH>Enviada</TH>
                <TH>Respuesta</TH>
              </TR>
            </THead>
            <TBody>
              {applications.map(({ application, job, brandName }) => (
                <TR key={application.id}>
                  <TH scope="row">
                    <Link href={`/trabajos/${job.id}`} className="link-row">
                      {job.title}
                    </Link>
                    <span className="block text-[0.8125rem] font-normal text-ink-3">{brandName}</span>
                  </TH>
                  <TD label="Pago" className="text-ink-2 tabular-nums">
                    {job.platform ? <><PlatformTag platform={job.platform} /> · </> : null}
                    {payRuleText(job.payRule)}
                  </TD>
                  <TD label="Enviada" muted>
                    {formatShortDate(application.createdAt)}
                  </TD>
                  <TD label="Respuesta">
                    <Badge tone={APPLICATION_STATUS[application.status].tone}>{APPLICATION_STATUS[application.status].label}</Badge>
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
