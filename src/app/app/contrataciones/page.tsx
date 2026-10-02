import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { Num } from "@/components/ui/num";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Stat, StatGroup } from "@/components/ui/stat";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { listMyContracts } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Mis trabajos" };

export default async function MyContractsPage() {
  const me = await requireUser("worker");
  const contracts = await listMyContracts(me.id);
  const totals = contracts.reduce(
    (sum, row) => ({ views: sum.views + row.performance.totalViews, paid: sum.paid + row.paid, owed: sum.owed + row.owed }),
    { views: 0, paid: 0, owed: 0 },
  );

  return (
    <>
      <PageHeader title="Mis trabajos" />

      {contracts.length === 0 ? (
        <EmptyState
          title="Todavía no tenés trabajos"
          action={<ButtonLink href="/trabajos">Ver trabajos</ButtonLink>}
        />
      ) : (
        <>
          <StatGroup cols={3} label="Resumen de mis trabajos">
            <Stat label="Vistas aprobadas" value={<Num value={totals.views} />} />
            <Stat label="Cobrado" value={<Money cents={totals.paid} />} />
            <Stat label="A cobrar" value={<Money cents={totals.owed} />} />
          </StatGroup>

          <Panel padded={false}>
            <Table caption="Mis trabajos" layout="stack" minWidth={640}>
              <THead>
                <TR>
                  <TH>Trabajo</TH>
                  <TH numeric>Videos</TH>
                  <TH numeric>Vistas</TH>
                  <TH numeric>Cobrado</TH>
                  <TH numeric>A cobrar</TH>
                </TR>
              </THead>
              <TBody>
                {contracts.map((row) => {
                  const ended = row.contract.status === "ended";
                  return (
                    <TR key={row.contract.id} tone={ended ? "muted" : "default"}>
                      <TH scope="row">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link href={`/app/contrataciones/${row.contract.id}`} className="link-row">
                            {row.contract.title}
                          </Link>
                          {row.requested > 0 ? <Badge tone="warning">{row.requested} por entregar</Badge> : null}
                          {row.paymentsToConfirm > 0 ? <Badge tone="warning">Pago por confirmar</Badge> : null}
                        </span>
                        <span className="block text-[0.8125rem] font-normal text-ink-3">
                          {ended ? "Finalizada · " : ""}
                          {row.brandName}
                        </span>
                      </TH>
                      <TD label="Videos" numeric>
                        <Num value={row.performance.approvedDeliverables} compact={false} />
                      </TD>
                      <TD label="Vistas" numeric>
                        <Num value={row.performance.totalViews} />
                      </TD>
                      <TD label="Cobrado" numeric>
                        <Money cents={row.paid} />
                      </TD>
                      <TD label="A cobrar" numeric>
                        <Money cents={row.owed} className={row.owed > 0 ? "font-medium text-ink" : undefined} />
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </Panel>
        </>
      )}
    </>
  );
}
