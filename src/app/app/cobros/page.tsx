import Link from "next/link";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/components/ui/format";
import { Money } from "@/components/ui/money";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Stat, StatGroup } from "@/components/ui/stat";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { confirmPayoutAction } from "@/lib/actions/money";
import { payoutStatus } from "@/lib/domain/labels";
import { getMyPaymentDetails, listMyContracts, listMyPayouts } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Cobros" };

/** La plata del gestor en un solo lugar: lo que tiene que confirmar, lo que le deben y lo que ya cobró. */
export default async function EarningsPage() {
  const me = await requireUser("worker");
  const [payouts, contracts, payment] = await Promise.all([listMyPayouts(me.id), listMyContracts(me.id), getMyPaymentDetails(me.id)]);

  const paid = payouts.filter((payout) => payout.status === "released");
  const toConfirm = paid.filter((payout) => payout.confirmedAt === null);
  const confirmed = paid.filter((payout) => payout.confirmedAt !== null);
  const owing = contracts.filter((row) => row.owed > 0);
  const sum = (list: { amount: number }[]) => list.reduce((total, row) => total + row.amount, 0);
  const owedTotal = owing.reduce((total, row) => total + row.owed, 0);

  return (
    <>
      <PageHeader title="Cobros" />

      {contracts.length > 0 && !payment?.account ? (
        <Notice
          tone="info"
          title="Cargá tus datos de cobro"
          action={
            <ButtonLink href="/app/perfil" size="sm" variant="secondary">
              Ir al perfil
            </ButtonLink>
          }
        >
          Quien te contrata los necesita para saber a dónde transferirte.
        </Notice>
      ) : null}

      <StatGroup cols={3} label="Mis cobros">
        <Stat label="Por confirmar" value={<Money cents={sum(toConfirm)} />} />
        <Stat label="A cobrar" value={<Money cents={owedTotal} />} />
        <Stat label="Cobrado" value={<Money cents={sum(confirmed)} />} />
      </StatGroup>

      {toConfirm.length > 0 ? (
        <Panel title="Por confirmar" description="Te informaron estos pagos. Confirmá cada uno cuando lo veas en tu cuenta." padded={false}>
          <Table caption="Pagos por confirmar" layout="stack" minWidth={640}>
            <THead>
              <TR>
                <TH>Quién paga</TH>
                <TH>Informado</TH>
                <TH numeric>Monto</TH>
                <TH>
                  <span className="sr-only">Acción</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {toConfirm.map((payout) => (
                <TR key={payout.id}>
                  <TH scope="row">
                    {payout.brandName}
                    <span className="block text-[0.8125rem] font-normal text-ink-3">
                      {payout.paidFrom ? `Transferencia a nombre de ${payout.paidFrom}` : payout.contractTitle}
                    </span>
                  </TH>
                  <TD label="Informado" className="text-ink-2">
                    {payout.releasedAt ? formatDate(payout.releasedAt) : null}
                  </TD>
                  <TD label="Monto" numeric className="font-semibold">
                    <Money cents={payout.amount} decimals="always" />
                  </TD>
                  <TD actions>
                    <ActionForm action={confirmPayoutAction} feedback="inline" className="flex flex-col items-start gap-1.5 sm:items-end">
                      <input type="hidden" name="payoutId" value={payout.id} />
                      <FormSubmit size="sm" pendingLabel="Guardando…">
                        Confirmar que cobré
                      </FormSubmit>
                    </ActionForm>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Panel>
      ) : null}

      {contracts.length === 0 ? (
        <EmptyState title="Todavía no tenés trabajos" action={<ButtonLink href="/trabajos">Ver búsquedas abiertas</ButtonLink>} />
      ) : (
        <Panel title="A cobrar" description="Lo que generaron tus vistas aprobadas y todavía no te pagaron." padded={false}>
          {owing.length === 0 ? (
            <EmptyState flush title="No te deben nada por ahora" />
          ) : (
            <Table caption="A cobrar por trabajo" layout="stack" minWidth={560}>
              <THead>
                <TR>
                  <TH>Trabajo</TH>
                  <TH>Estado</TH>
                  <TH numeric>Monto</TH>
                </TR>
              </THead>
              <TBody>
                {owing.map((row) => (
                  <TR key={row.contract.id}>
                    <TH scope="row">
                      <Link href={`/app/contrataciones/${row.contract.id}`} className="link-row">
                        {row.contract.title}
                      </Link>
                      <span className="block text-[0.8125rem] font-normal text-ink-3">{row.brandName}</span>
                    </TH>
                    <TD label="Estado">
                      {row.pendingPayout >= row.owed ? <Badge tone="warning">Liquidado, falta el pago</Badge> : <Badge>Sin liquidar</Badge>}
                    </TD>
                    <TD label="Monto" numeric>
                      <Money cents={row.owed} decimals="always" />
                    </TD>
                  </TR>
                ))}
              </TBody>
              <TFoot>
                <TR>
                  <TH scope="row">Total</TH>
                  <TD />
                  <TD numeric className="text-[0.9375rem] font-semibold">
                    <Money cents={owedTotal} decimals="always" />
                  </TD>
                </TR>
              </TFoot>
            </Table>
          )}
        </Panel>
      )}

      {confirmed.length > 0 ? (
        <Panel title="Cobrado" padded={false}>
          <Table caption="Pagos cobrados" layout="stack" minWidth={560}>
            <THead>
              <TR>
                <TH>Quién pagó</TH>
                <TH>Fecha</TH>
                <TH>Estado</TH>
                <TH numeric>Monto</TH>
              </TR>
            </THead>
            <TBody>
              {confirmed.map((payout) => (
                <TR key={payout.id}>
                  <TH scope="row">
                    {payout.brandName}
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
