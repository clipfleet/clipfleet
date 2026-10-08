import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { PayeeBlock } from "@/components/domain/payee-block";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/components/ui/format";
import { Money } from "@/components/ui/money";
import { Num } from "@/components/ui/num";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Stat, StatGroup } from "@/components/ui/stat";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { generatePayouts, markPayoutPaidAction } from "@/lib/actions/money";
import { payoutStatus } from "@/lib/domain/labels";
import { listPayouts } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Liquidaciones" };

export default async function PayoutsPage() {
  const me = await requireUser("hirer");
  const payouts = await listPayouts(me.id);
  const pending = payouts.filter((payout) => payout.status === "pending");
  const paid = payouts.filter((payout) => payout.status === "released");
  const sum = (list: typeof payouts) => list.reduce((total, payout) => total + payout.amount, 0);

  return (
    <>
      <PageHeader
        title="Liquidaciones"
        actions={
          <ActionForm action={generatePayouts} feedback="inline" className="flex flex-col items-start gap-1.5 sm:items-end">
            <FormSubmit variant={pending.length > 0 ? "secondary" : "primary"} pendingLabel="Calculando…">
              {pending.length > 0 ? "Recalcular" : "Calcular liquidaciones"}
            </FormSubmit>
          </ActionForm>
        }
      />

      <StatGroup cols={2} label="Pagos">
        <Stat label="Por pagar" value={<Money cents={sum(pending)} />} />
        <Stat label="Pagado" value={<Money cents={sum(paid)} />} />
      </StatGroup>

      <section aria-labelledby="por-pagar" className="flex flex-col gap-3">
        <h2 id="por-pagar" className="type-title">
          Por pagar
        </h2>
        {pending.length === 0 ? (
          <EmptyState title="No hay nada por pagar" description="Las vistas que apruebes en Equipo aparecen acá al calcular las liquidaciones." />
        ) : (
          pending.map((payout) => (
            <Panel
              key={payout.id}
              title={payout.worker.name}
              description={`${payout.contractTitle} · del ${formatDate(payout.periodStart)} al ${formatDate(payout.periodEnd)}`}
              headingLevel={3}
              padded={false}
              actions={
                <ActionForm action={markPayoutPaidAction} feedback="inline" className="flex flex-col items-start gap-1.5 sm:items-end">
                  <input type="hidden" name="payoutId" value={payout.id} />
                  <FormSubmit pendingLabel="Guardando…" confirm={`¿Ya le pagaste a ${payout.worker.name}? Le vamos a pedir que confirme el cobro.`}>
                    Marcar como pagado
                  </FormSubmit>
                </ActionForm>
              }
            >
              <div className="border-b border-line px-4 py-3.5 sm:px-5">
                <PayeeBlock payee={payout.payee} name={payout.worker.name} />
              </div>
              <Table caption={`Detalle de la liquidación de ${payout.worker.name}`} minWidth={0}>
                <THead>
                  <TR>
                    <TH>Video</TH>
                    <TH numeric>Vistas</TH>
                    <TH hideBelow="md">Regla aplicada</TH>
                    <TH numeric>Pago</TH>
                  </TR>
                </THead>
                <TBody>
                  {payout.items.map((item) => (
                    <TR key={item.id}>
                      <TD>{item.title || "Video"}</TD>
                      <TD numeric>
                        <Num value={item.views} compact={false} />
                      </TD>
                      <TD muted hideBelow="md">
                        {item.reason}
                      </TD>
                      <TD numeric>
                        <Money cents={item.amount} decimals="always" />
                      </TD>
                    </TR>
                  ))}
                </TBody>
                <TFoot>
                  <TR>
                    <TH scope="row">Total a pagar</TH>
                    <TD />
                    <TD hideBelow="md" />
                    <TD numeric className="text-[0.9375rem] font-semibold">
                      <Money cents={payout.amount} decimals="always" />
                    </TD>
                  </TR>
                </TFoot>
              </Table>
            </Panel>
          ))
        )}
      </section>

      {paid.length > 0 ? (
        <Panel title="Pagadas" padded={false}>
          <Table caption="Liquidaciones pagadas" layout="stack" minWidth={560}>
            <THead>
              <TR>
                <TH>Persona</TH>
                <TH>Fecha</TH>
                <TH>Estado</TH>
                <TH numeric>Monto</TH>
              </TR>
            </THead>
            <TBody>
              {paid.map((payout) => (
                <TR key={payout.id}>
                  <TH scope="row">
                    {payout.worker.name}
                    <span className="block text-[0.8125rem] font-normal text-ink-3">{payout.contractTitle}</span>
                  </TH>
                  <TD label="Fecha" className="text-ink-2">
                    {payout.releasedAt ? formatDate(payout.releasedAt) : null}
                  </TD>
                  <TD label="Estado">
                    <Badge tone={payoutStatus(payout).tone}>{payoutStatus(payout).label}</Badge>
                  </TD>
                  <TD label="Monto" numeric>
                    <Money cents={payout.amount} decimals="always" />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Panel>
      ) : null}
    </>
  );
}
