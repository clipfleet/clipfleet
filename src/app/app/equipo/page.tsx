import Link from "next/link";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { Num } from "@/components/ui/num";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Stat, StatGroup } from "@/components/ui/stat";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { generatePayouts } from "@/lib/actions/money";
import { listTeam } from "@/lib/queries";
import { teamByPerson } from "@/lib/stats/team";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Equipo" };

export default async function TeamPage() {
  const me = await requireUser("hirer");
  const team = await listTeam(me.id);
  const people = teamByPerson(team);

  const totals = team.reduce(
    (sum, row) => ({
      views: sum.views + row.performance.totalViews,
      paid: sum.paid + row.paid,
      owed: sum.owed + row.owed,
      // Para el costo por mil solo cuenta lo pagado en trabajos que generaron vistas.
      paidForViews: sum.paidForViews + (row.performance.totalViews > 0 ? row.paid : 0),
    }),
    { views: 0, paid: 0, owed: 0, paidForViews: 0 },
  );

  return (
    <>
      <PageHeader
        title="Equipo"
        actions={
          <>
            <ButtonLink href="/app/equipo/invitar" variant="secondary">
              Invitar por link
            </ButtonLink>
            {totals.owed > 0 ? (
              <ActionForm action={generatePayouts} feedback="inline" className="flex flex-col items-start gap-1.5 sm:items-end">
                <FormSubmit pendingLabel="Calculando…">
                  Liquidar lo adeudado
                </FormSubmit>
              </ActionForm>
            ) : null}
          </>
        }
      />

      {team.length === 0 ? (
        <EmptyState
          title="Todavía no tenés a nadie en el equipo"
          action={
            <span className="flex flex-wrap gap-2">
              <ButtonLink href="/app/equipo/invitar">Invitar por link</ButtonLink>
              <ButtonLink href="/app/busquedas/nueva" variant="secondary">
                Publicar campaña
              </ButtonLink>
            </span>
          }
        />
      ) : (
        <>
          <StatGroup cols={3} label="Resumen del equipo">
            <Stat label="Vistas aprobadas" value={<Num value={totals.views} />} />
            <Stat label="Pagado" value={<Money cents={totals.paid} />} />
            <Stat label="Adeudado" value={<Money cents={totals.owed} />} />
          </StatGroup>

          <Panel padded={false}>
            <Table caption="Rendimiento por persona" layout="stack" minWidth={640}>
              <THead>
                <TR>
                  <TH>Persona</TH>
                  <TH numeric>Videos</TH>
                  <TH numeric>Vistas</TH>
                  <TH numeric>Costo / 1.000</TH>
                  <TH numeric>Pagado</TH>
                  <TH numeric>Adeudado</TH>
                </TR>
              </THead>
              <TBody>
                {people.map((person) => (
                  <TR key={person.worker.username} tone={person.ended ? "muted" : "default"}>
                    <TH scope="row">
                      <span className="flex items-start gap-3">
                        <Avatar name={person.worker.name} className="max-sm:hidden" />
                        <span className="min-w-0">
                          <Link href={`/app/talento/${person.worker.username}`} className="link-row">
                            {person.worker.name}
                          </Link>
                          <span className="mt-0.5 flex flex-col gap-0.5">
                            {person.contracts.map((row) => {
                              const waiting = row.performance.pendingReview + row.pendingViews;
                              return (
                                <span key={row.contract.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] font-normal">
                                  <Link href={`/app/equipo/${row.contract.id}`} className="truncate text-ink-2 underline-offset-2 hover:text-ink hover:underline sm:max-w-[18rem]" title={row.contract.title}>
                                    {row.contract.status === "ended" ? "Finalizada · " : ""}
                                    {row.contract.title}
                                  </Link>
                                  {waiting > 0 ? <Badge tone="warning">{waiting} para revisar</Badge> : null}
                                </span>
                              );
                            })}
                          </span>
                        </span>
                      </span>
                    </TH>
                    <TD numeric label="Videos">
                      <Num value={person.videos} compact={false} />
                    </TD>
                    <TD numeric label="Vistas">
                      <Num value={person.views} />
                    </TD>
                    <TD numeric label="Costo / 1.000">
                      <Money cents={person.costPerThousand} decimals="never" />
                    </TD>
                    <TD numeric label="Pagado">
                      <Money cents={person.paid} />
                    </TD>
                    <TD numeric label="Adeudado">
                      <Money cents={person.owed} className={person.owed > 0 ? "font-medium text-ink" : undefined} />
                    </TD>
                  </TR>
                ))}
              </TBody>
              <TFoot>
                <TR>
                  <TH scope="row">Total</TH>
                  <TD />
                  <TD numeric label="Vistas">
                    <Num value={totals.views} />
                  </TD>
                  <TD numeric label="Costo / 1.000">
                    <Money cents={totals.views > 0 && totals.paidForViews > 0 ? Math.round((totals.paidForViews * 1000) / totals.views) : null} decimals="never" />
                  </TD>
                  <TD numeric label="Pagado">
                    <Money cents={totals.paid} />
                  </TD>
                  <TD numeric label="Adeudado">
                    <Money cents={totals.owed} />
                  </TD>
                </TR>
              </TFoot>
            </Table>
          </Panel>
        </>
      )}
    </>
  );
}
