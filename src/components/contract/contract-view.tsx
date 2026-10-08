import clsx from "clsx";
import type { ReactNode } from "react";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { payRuleText } from "@/components/domain/pay-rule-summary";
import { PlatformTag } from "@/components/domain/platform";
import { Rating } from "@/components/domain/rating";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Disclosure, DisclosureGroup } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { formatDate, formatMoney, formatShortDate } from "@/components/ui/format";
import { ExternalIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { Num } from "@/components/ui/num";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { Stat, StatGroup } from "@/components/ui/stat";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { decideViews, endContract, leaveReview, reportViews, reviewDeliverable, sendMessage, setViews, submitDeliverable } from "@/lib/actions/contracts";
import { PayeeBlock } from "@/components/domain/payee-block";
import { httpUrl } from "@/lib/actions/result";
import { confirmPayoutAction, generatePayouts, markPayoutPaidAction } from "@/lib/actions/money";
import { PLATFORM_LABEL, type Platform } from "@/lib/domain/categories";
import { CONTRACT_STATUS, DELIVERABLE_STATUS, payoutStatus } from "@/lib/domain/labels";
import type { getContractDetail } from "@/lib/queries";

type Detail = NonNullable<Awaited<ReturnType<typeof getContractDetail>>>;
type Deliverable = Detail["deliverables"][number];
type Payout = Detail["payouts"][number];

const RATING_OPTIONS = [
  { value: "5", label: "5 · Excelente" },
  { value: "4", label: "4 · Muy bien" },
  { value: "3", label: "3 · Bien" },
  { value: "2", label: "2 · Flojo" },
  { value: "1", label: "1 · Mal" },
];

/** Formularios en línea de una fila de la tabla: a la derecha en escritorio, a la izquierda en la ficha del celular. */
const ROW_FORM = "flex flex-wrap items-center gap-2 sm:justify-end";

/**
 * Acción secundaria de una fila: se ve como un botón discreto y, al abrirla, deja el formulario en su lugar.
 * Así la tabla no repite controles en todas las filas. <details> nativo, sin JavaScript.
 */
function RowAction({ label, variant = "ghost", children }: { label: string; variant?: "ghost" | "secondary"; children: ReactNode }) {
  return (
    <details className="group/action">
      <summary
        className={buttonClasses({
          variant,
          size: "sm",
          className: clsx("cursor-pointer list-none group-open/action:hidden [&::-webkit-details-marker]:hidden", variant === "ghost" && "max-sm:-ml-3"),
        })}
      >
        {label}
      </summary>
      {children}
    </details>
  );
}

function DeliverableLink({ deliverable }: { deliverable: Deliverable }) {
  const title = deliverable.title || "Video";
  const where = [
    deliverable.platform ? PLATFORM_LABEL[deliverable.platform as Platform] ?? deliverable.platform : null,
    deliverable.accountHandle,
    deliverable.dueAt ? `vence ${formatShortDate(deliverable.dueAt)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      {httpUrl(deliverable.url) ? (
        <a href={httpUrl(deliverable.url)!} target="_blank" rel="noopener noreferrer nofollow" className="link-row inline-flex items-center gap-1.5">
          {title}
          <ExternalIcon className="size-3.5 shrink-0 text-ink-3" />
        </a>
      ) : (
        title
      )}
      {where ? <span className="block text-[0.8125rem] font-normal text-ink-3">{where}</span> : null}
    </>
  );
}

/** Lo que cada parte puede hacer con un video, según su estado. */
function DeliverableActions({ deliverable, viewer, active }: { deliverable: Deliverable; viewer: "hirer" | "worker"; active: boolean }) {
  const snapshot = deliverable.pendingSnapshot;

  if (viewer === "hirer") {
    if (deliverable.status === "submitted") {
      return (
        <ActionForm action={reviewDeliverable} feedback="inline" className={ROW_FORM}>
          <input type="hidden" name="deliverableId" value={deliverable.id} />
          <FormSubmit size="sm" variant="secondary" name="decision" value="approved">
            Aprobar
          </FormSubmit>
          <FormSubmit size="sm" variant="ghost" name="decision" value="rejected" confirm="¿Rechazar este video? No se puede deshacer.">
            Rechazar
          </FormSubmit>
        </ActionForm>
      );
    }
    if (snapshot) {
      return (
        <ActionForm action={decideViews} feedback="inline" className={ROW_FORM}>
          <input type="hidden" name="snapshotId" value={snapshot.id} />
          <span className="text-[0.8125rem] whitespace-nowrap text-ink-2">
            Reporta <Num value={snapshot.views} compact={false} className="font-medium text-ink" />
          </span>
          <FormSubmit size="sm" variant="secondary" name="decision" value="approved">
            Aprobar vistas
          </FormSubmit>
          <FormSubmit size="sm" variant="ghost" name="decision" value="rejected">
            Rechazar
          </FormSubmit>
        </ActionForm>
      );
    }
    if (deliverable.status === "approved" && deliverable.kind === "post") {
      return (
        <RowAction label="Actualizar vistas">
          <ActionForm action={setViews} feedback="inline" className={ROW_FORM}>
            <input type="hidden" name="deliverableId" value={deliverable.id} />
            <Input name="views" type="number" min="0" step="1" inputMode="numeric" aria-label="Vistas verificadas" placeholder="Vistas" size="sm" className="w-28" />
            <FormSubmit size="sm" variant="secondary">
              Actualizar
            </FormSubmit>
          </ActionForm>
        </RowAction>
      );
    }
    return null;
  }

  // Pedidos con fecha: ya no se crean desde la interfaz, pero los que existan se pueden entregar.
  if (deliverable.status === "requested") {
    return (
      <ActionForm action={submitDeliverable} feedback="inline" className={ROW_FORM}>
        <input type="hidden" name="deliverableId" value={deliverable.id} />
        <Input name="url" type="url" required aria-label="Link del video" placeholder="https://…" size="sm" className="w-full sm:w-64" />
        <FormSubmit size="sm" variant="secondary">
          Entregar
        </FormSubmit>
      </ActionForm>
    );
  }
  if (snapshot) {
    return (
      <span className="text-[0.8125rem] text-ink-3">
        Reportaste <Num value={snapshot.views} compact={false} />: espera aprobación
      </span>
    );
  }
  if (deliverable.kind === "post" && (deliverable.status === "approved" || deliverable.status === "submitted") && active) {
    return (
      <RowAction label="Reportar vistas" variant="secondary">
        <ActionForm action={reportViews} resetOnSuccess feedback="inline" className={ROW_FORM}>
          <input type="hidden" name="deliverableId" value={deliverable.id} />
          <Input name="views" type="number" min="0" step="1" required inputMode="numeric" aria-label="Vistas actuales" placeholder="Vistas hoy" size="sm" className="w-28" />
          <FormSubmit size="sm" variant="secondary">
            Reportar
          </FormSubmit>
        </ActionForm>
      </RowAction>
    );
  }
  return null;
}

/**
 * Una liquidación que espera algo de quien mira: marcarla como pagada
 * (contratador) o confirmar el cobro (trabajador). Va arriba de todo: es lo
 * único de la pantalla que tiene a la otra parte esperando.
 */
function PayoutPrompt({
  payout,
  viewer,
  counterpart,
  payment,
}: {
  payout: Payout;
  viewer: "hirer" | "worker";
  counterpart: string;
  payment: Detail["payment"];
}) {
  const paidFrom = payout.paidFromHolder ?? payment.payerHolder;
  const videos = `${payout.items.length} ${payout.items.length === 1 ? "video" : "videos"}`;
  return (
    <section
      aria-label={viewer === "hirer" ? "Liquidación por pagar" : "Pago por confirmar"}
      className="flex flex-col gap-4 rounded-lg border border-accent-line bg-accent-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5"
    >
      <div className="min-w-0">
        <p className="text-[0.8125rem] text-ink-2">{viewer === "hirer" ? "Liquidación por pagar" : `${counterpart} informó que te pagó`}</p>
        <p className="mt-0.5 text-xl leading-7 font-semibold tracking-[-0.02em]">
          <Money cents={payout.amount} decimals="always" />
        </p>
        <p className="mt-0.5 text-[0.8125rem] text-ink-2">
          {videos}, hasta el {formatDate(payout.periodEnd)}.{" "}
          {viewer === "hirer"
            ? `El pago se hace por fuera; después ${counterpart} confirma el cobro.`
            : `${paidFrom ? `La transferencia sale a nombre de ${paidFrom}. ` : ""}Confirmá solo si ya la recibiste.`}
        </p>
        {viewer === "hirer" ? (
          <div className="mt-3">
            <PayeeBlock payee={payment.payee} name={counterpart} />
          </div>
        ) : null}
      </div>
      <ActionForm
        action={viewer === "hirer" ? markPayoutPaidAction : confirmPayoutAction}
        feedback="inline"
        className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end"
      >
        <input type="hidden" name="payoutId" value={payout.id} />
        <FormSubmit
          pendingLabel="Guardando…"
          confirm={viewer === "hirer" ? `¿Ya le pagaste a ${counterpart}? Le vamos a pedir que confirme el cobro.` : undefined}
        >
          {viewer === "hirer" ? "Marcar como pagado" : "Confirmar que cobré"}
        </FormSubmit>
      </ActionForm>
    </section>
  );
}

/**
 * Detalle de una contratación. La misma pantalla para las dos partes; cambian las acciones.
 * La tabla de videos es la pantalla: lo que espera una acción va arriba y todo lo demás, plegado debajo.
 */
export function ContractView({ detail, viewer, userId }: { detail: Detail; viewer: "hirer" | "worker"; userId: string }) {
  const { contract, performance, money } = detail;
  const active = contract.status === "active";
  const counterpart = viewer === "hirer" ? detail.worker.name : detail.hirer.brandName;
  const myReview = detail.reviews.find((review) => review.authorId === userId);
  const theirReview = detail.reviews.find((review) => review.authorId !== userId);
  const back = viewer === "hirer" ? { href: "/app/equipo", label: "Equipo" } : { href: "/app/contrataciones", label: "Mis trabajos" };
  const awaitingMe = detail.payouts.filter((payout) =>
    viewer === "hirer" ? payout.status === "pending" : payout.status === "released" && payout.confirmedAt === null,
  );

  return (
    <>
      <PageHeader
        back={back}
        title={viewer === "hirer" ? detail.worker.name : contract.title}
        meta={
          <>
            {active ? null : <Badge tone={CONTRACT_STATUS[contract.status].tone}>{CONTRACT_STATUS[contract.status].label}</Badge>}
            <span>{viewer === "hirer" ? contract.title : counterpart}</span>
          </>
        }
        actions={
          viewer === "hirer" ? (
            <>
              <ButtonLink href={`/t/${detail.worker.username}`} variant="secondary">
                Ver perfil
              </ButtonLink>
              {money.owed > 0 ? (
                <ActionForm action={generatePayouts} feedback="inline" className="flex flex-col items-start gap-1.5 sm:items-end">
                  <input type="hidden" name="contractId" value={contract.id} />
                  {/* Con una liquidación ya calculada y sin pagar, lo principal es pagarla: recalcular pasa a segundo plano. */}
                  {awaitingMe.length > 0 ? (
                    <FormSubmit variant="secondary" pendingLabel="Calculando…">
                      Recalcular
                    </FormSubmit>
                  ) : (
                    <FormSubmit pendingLabel="Calculando…">Liquidar {formatMoney(money.owed)}</FormSubmit>
                  )}
                </ActionForm>
              ) : null}
            </>
          ) : null
        }
      />

      {awaitingMe.map((payout) => (
        <PayoutPrompt key={payout.id} payout={payout} viewer={viewer} counterpart={counterpart} payment={detail.payment} />
      ))}

      {viewer === "worker" && active && detail.payment.mineMissing ? (
        <Notice
          tone="info"
          title="Cargá tus datos de cobro"
          action={
            <ButtonLink href="/app/perfil" size="sm" variant="secondary">
              Ir al perfil
            </ButtonLink>
          }
        >
          {counterpart} los necesita para saber a dónde transferirte.
        </Notice>
      ) : null}

      <StatGroup cols={3} label="Rendimiento de la contratación">
        <Stat label="Vistas aprobadas" value={<Num value={performance.totalViews} />} />
        <Stat label={viewer === "hirer" ? "Pagado" : "Cobrado"} value={<Money cents={money.paid} />} />
        <Stat label={viewer === "hirer" ? "Adeudado" : "A cobrar"} value={<Money cents={money.owed} />} />
      </StatGroup>

      <Panel
        title="Videos"
        description={
          <>
            {contract.platform ? (
              <>
                <PlatformTag platform={contract.platform} name={contract.platformName} className="align-bottom text-ink-2" /> ·{" "}
              </>
            ) : null}
            <span className="text-ink-2 tabular-nums">{payRuleText(contract.payRule)}</span> · El pago se hace por fuera, entre ustedes.
          </>
        }
        padded={false}
      >
        {active && viewer === "worker" ? (
          <div className="border-b border-line bg-wash px-4 py-4 sm:px-5">
            <ActionForm action={submitDeliverable} resetOnSuccess className="grid items-end gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
              <input type="hidden" name="contractId" value={contract.id} />
              <input type="hidden" name="kind" value="post" />
              <Field label="Link del video publicado">
                <Input name="url" type="url" required placeholder="https://…" />
              </Field>
              <Field label="Cuenta" optional>
                <Input name="accountHandle" placeholder="@cuenta" />
              </Field>
              <FormSubmit pendingLabel="Cargando…">Cargar video</FormSubmit>
            </ActionForm>
          </div>
        ) : null}

        {detail.deliverables.length === 0 ? (
          <EmptyState flush title={viewer === "hirer" ? "Todavía no cargó ningún video" : "Todavía no cargaste ningún video"} />
        ) : (
          <Table caption="Videos de la contratación" layout="stack" minWidth={640}>
            <THead>
              <TR>
                <TH>Video</TH>
                <TH>Estado</TH>
                <TH numeric>Vistas</TH>
                <TH align="right">
                  <span className="sr-only">Acción</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {detail.deliverables.map((deliverable) => (
                <TR key={deliverable.id}>
                  <TH scope="row">
                    <DeliverableLink deliverable={deliverable} />
                  </TH>
                  <TD label="Estado">
                    <Badge tone={DELIVERABLE_STATUS[deliverable.status].tone}>{DELIVERABLE_STATUS[deliverable.status].label}</Badge>
                  </TD>
                  <TD label="Vistas" numeric>
                    <Num value={deliverable.kind === "post" ? deliverable.views : null} compact={false} />
                  </TD>
                  <TD actions align="right">
                    <DeliverableActions deliverable={deliverable} viewer={viewer} active={active} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>

      <DisclosureGroup>
        <Disclosure title="Liquidaciones" meta={detail.payouts.length > 0 ? detail.payouts.length : undefined}>
          {detail.payouts.length === 0 ? (
            <p className="text-sm text-ink-2">Todavía no hay liquidaciones en esta contratación.</p>
          ) : (
            <ul className="flex max-w-form flex-col divide-y divide-line">
              {detail.payouts.map((payout) => (
                <li key={payout.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-2">
                    {formatDate(payout.periodEnd)}
                    <Badge tone={payoutStatus(payout).tone}>{payoutStatus(payout).label}</Badge>
                  </span>
                  <Money cents={payout.amount} decimals="always" className="text-sm font-medium" />
                </li>
              ))}
            </ul>
          )}
        </Disclosure>

        <Disclosure title="Mensajes" meta={detail.messages.length > 0 ? detail.messages.length : undefined}>
          <div className="flex max-w-prose flex-col gap-5">
            {detail.messages.length > 0 ? (
              <ol className="flex flex-col gap-4">
                {detail.messages.map((message) => (
                  <li key={message.id}>
                    <p className="text-[0.8125rem] text-ink-3">
                      <span className="font-medium text-ink">{message.authorId === userId ? "Vos" : message.authorName}</span> · {formatShortDate(message.createdAt)}
                    </p>
                    <p className="mt-0.5 text-sm whitespace-pre-wrap text-ink-2">{message.body}</p>
                  </li>
                ))}
              </ol>
            ) : null}
            <ActionForm action={sendMessage} resetOnSuccess className="flex flex-col gap-3">
              <input type="hidden" name="contractId" value={contract.id} />
              <Textarea name="body" required rows={2} aria-label="Mensaje" placeholder="Escribí un mensaje…" />
              <div>
                <FormSubmit size="sm" variant="secondary">
                  Enviar mensaje
                </FormSubmit>
              </div>
            </ActionForm>
          </div>
        </Disclosure>

        {active ? (
          <Disclosure title="Finalizar la contratación">
            <ActionForm action={endContract} className="flex max-w-prose flex-col gap-3">
              <input type="hidden" name="contractId" value={contract.id} />
              <p className="text-sm text-ink-2">No se cargan más videos. Lo ya aprobado se puede seguir liquidando.</p>
              <div>
                <FormSubmit size="sm" variant="danger" confirm="¿Finalizar esta contratación?">
                  Finalizar contratación
                </FormSubmit>
              </div>
            </ActionForm>
          </Disclosure>
        ) : (
          <Disclosure title="Reseñas" defaultOpen={!myReview}>
            <div className="flex max-w-form flex-col gap-5">
              {theirReview ? (
                <div className="flex flex-col gap-1">
                  <p className="text-[0.8125rem] text-ink-3">{counterpart} escribió sobre vos</p>
                  <Rating value={theirReview.rating} />
                  {theirReview.comment ? <p className="text-sm text-ink-2">{theirReview.comment}</p> : null}
                </div>
              ) : null}
              {myReview ? (
                <div className="flex flex-col gap-1">
                  <p className="text-[0.8125rem] text-ink-3">Tu reseña</p>
                  <Rating value={myReview.rating} />
                  {myReview.comment ? <p className="text-sm text-ink-2">{myReview.comment}</p> : null}
                </div>
              ) : (
                <ActionForm action={leaveReview} className="flex flex-col gap-4">
                  <input type="hidden" name="contractId" value={contract.id} />
                  <Field label={`¿Cómo fue trabajar con ${counterpart}?`}>
                    <Select name="rating" options={RATING_OPTIONS} defaultValue="5" />
                  </Field>
                  <Field label="Comentario" optional hint="Es público: aparece en su perfil.">
                    <Textarea name="comment" rows={3} />
                  </Field>
                  <div>
                    <FormSubmit size="sm">Publicar reseña</FormSubmit>
                  </div>
                </ActionForm>
              )}
            </div>
          </Disclosure>
        )}
      </DisclosureGroup>
    </>
  );
}
