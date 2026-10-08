import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { JobList, JobRow } from "@/components/domain/job-row";
import { PayRuleSummary, payRuleText, type PayRuleInput } from "@/components/domain/pay-rule-summary";
import { Rating } from "@/components/domain/rating";
import { ReviewItem } from "@/components/domain/review-item";
import { TrackRecord } from "@/components/domain/track-record";
import { CopyField } from "@/components/forms/copy-field";
import { AppShell } from "@/components/shell/app-shell";
import { PublicFooter } from "@/components/shell/public-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { Wordmark } from "@/components/shell/wordmark";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Disclosure, DisclosureGroup } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { CheckIcon, GridIcon, ReceiptIcon, SearchIcon, TeamIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { Notice } from "@/components/ui/notice";
import { Num } from "@/components/ui/num";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { RadioCards } from "@/components/ui/radio-cards";
import { Select } from "@/components/ui/select";
import { Stat, StatGroup } from "@/components/ui/stat";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Kit de UI",
  robots: { index: false, follow: false },
};

// Todos los datos de esta página son de ejemplo.

const RULE_CPM: PayRuleInput = {
  fixedPerDeliverable: 0,
  variable: { type: "cpm", ratePerThousand: 120_000, minViews: 10_000, capPerDeliverable: 15_000_000 },
};
const RULE_TIERS: PayRuleInput = {
  fixedPerDeliverable: 500_000,
  variable: {
    type: "tiers",
    tiers: [
      { minViews: 10_000, amount: 1_500_000 },
      { minViews: 100_000, amount: 9_000_000 },
    ],
  },
};
const RULE_FIXED: PayRuleInput = { fixedPerDeliverable: 2_000_000, variable: null };

const TEAM = [
  { name: "Brenda Sosa", job: "Recortes del podcast", waiting: 2, ended: false, videos: 42, views: 1_240_000, cpm: 9_800, paid: 12_150_000, owed: 1_864_000 },
  { name: "Tomás Ruiz", job: "Clips del stream", waiting: 0, ended: true, videos: 18, views: 386_000, cpm: 12_100, paid: 4_670_000, owed: 0 },
];

async function noopSignOut() {
  "use server";
}

/** Muestra viva del sistema de diseño. Solo existe en desarrollo. */
export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <AppShell
      user={{ name: "Lucía Benítez", username: "lucia", role: "hirer" }}
      nav={[
        { href: "/ui-kit", label: "Kit de UI", icon: <GridIcon /> },
        { href: "/app/equipo", label: "Equipo", icon: <TeamIcon />, badge: 2 },
        { href: "/app/busquedas", label: "Búsquedas", icon: <SearchIcon /> },
        { href: "/app/liquidaciones", label: "Liquidaciones", icon: <ReceiptIcon /> },
      ]}
      signOutAction={noopSignOut}
    >
      <PageHeader
        title="Kit de UI"
        meta={<Badge tone="info">Solo en desarrollo</Badge>}
        actions={
          <>
            <ButtonLink href="/" variant="secondary">
              Ver la landing
            </ButtonLink>
            <Button>Acción principal</Button>
          </>
        }
      />

      <Group title="Tipografía">
        <Panel>
          <div className="flex flex-col gap-6">
            <Specimen name="type-display · titular de la landing">
              <p className="type-display text-5xl">El trabajo de multicuentas, con las cuentas claras.</p>
            </Specimen>
            <Specimen name="type-page · título de página (h1)">
              <p className="type-page">Liquidaciones</p>
            </Specimen>
            <Specimen name="type-title · título de panel">
              <p className="type-title">Videos</p>
            </Specimen>
            <Specimen name="texto base · 14px">
              <p className="max-w-prose text-ink-2">Se acuerda una regla de pago, se aprueban los videos y las vistas, y lo que le corresponde a cada persona se calcula solo.</p>
            </Specimen>
            <Specimen name="type-label · rótulo">
              <p className="type-label text-ink-3">Vistas aprobadas</p>
            </Specimen>
            <Specimen name="tabular-nums · cifras">
              <p className="text-2xl leading-8 font-semibold tracking-[-0.02em] tabular-nums">$ 259.400 · 1.240.000 · 84 mil</p>
            </Specimen>
            <Specimen name="Wordmark">
              <div className="flex flex-wrap items-center gap-8">
                <Wordmark href={null} size="sm" />
                <Wordmark href={null} size="md" />
                <Wordmark href={null} size="lg" />
              </div>
            </Specimen>
          </div>
        </Panel>
      </Group>

      <Group title="Color">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
          {SWATCHES.map((swatch) => (
            <div key={swatch.name} className="flex flex-col gap-2">
              <div className={`h-12 rounded-md border border-line ${swatch.className}`} />
              <div>
                <p className="text-[0.8125rem] font-medium">{swatch.name}</p>
                <p className="text-xs text-ink-3">{swatch.use}</p>
              </div>
            </div>
          ))}
        </div>
      </Group>

      <Group title="Button y ButtonLink">
        <Panel>
          <div className="flex flex-col gap-6">
            <Specimen name="variant">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary">Publicar búsqueda</Button>
                <Button variant="secondary">Invitar por link</Button>
                <Button variant="ghost">Cancelar</Button>
                <Button variant="danger">Finalizar contratación</Button>
              </div>
            </Specimen>
            <Specimen name="size · disabled · pending">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Chico</Button>
                <Button size="md">Mediano</Button>
                <Button size="lg">Grande</Button>
                <Button disabled>Deshabilitado</Button>
                <Button variant="secondary" disabled>
                  Deshabilitado
                </Button>
                <Button pending pendingLabel="Guardando…">
                  Marcar como pagado
                </Button>
              </div>
            </Specimen>
          </div>
        </Panel>
      </Group>

      <Group title="Field, Input, Textarea, Select, RadioCards">
        <Panel className="max-w-2xl">
          <form className="flex flex-col gap-5">
            <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
              <Field label="Título">
                <Input name="title" defaultValue="Subir recortes del podcast" />
              </Field>
              <Field label="Cupos">
                <Input name="slots" type="number" min={1} defaultValue={3} />
              </Field>
            </div>
            <RadioCards
              name="variableType"
              legend="¿Cómo pagás?"
              defaultValue="cpm"
              columns={3}
              options={[
                { value: "cpm", title: "Por cada 1.000 vistas" },
                { value: "tiers", title: "Por escalones de vistas" },
                { value: "none", title: "Fijo por video" },
              ]}
            />
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field label="Pago cada 1.000 vistas">
                <Input name="rate" inputMode="decimal" leading="$" defaultValue="1.200" />
              </Field>
              <Field label="Mínimo de vistas" hint="Debajo de esto el video no cobra." error="Tiene que ser un número entero.">
                <Input name="minViews" inputMode="numeric" trailing="vistas" defaultValue="diez mil" />
              </Field>
            </div>
            <Disclosure title="Más opciones" variant="plain">
              <Field label="Tope por video" className="sm:max-w-56">
                <Input name="cap" inputMode="decimal" leading="$" />
              </Field>
            </Disclosure>
            <Field label="Descripción" optional>
              <Textarea name="description" />
            </Field>
            <Field label="Deshabilitado">
              <Input name="disabled" disabled defaultValue="No se puede editar" />
            </Field>
            <Specimen name={'size="sm" — controles dentro de una fila de tabla'}>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  size="sm"
                  aria-label="Calificación"
                  defaultValue="5"
                  className="w-40"
                  options={[
                    { value: "5", label: "5 · Excelente" },
                    { value: "4", label: "4 · Muy bien" },
                  ]}
                />
                <Input size="sm" aria-label="Vistas" placeholder="Vistas" className="w-28" />
                <Button size="sm" variant="secondary">
                  Aprobar
                </Button>
                <Button size="sm" variant="ghost">
                  Rechazar
                </Button>
              </div>
            </Specimen>
            <Specimen name="CopyField">
              <CopyField value="https://ejemplo.local/invitacion/abc123" label="Link de invitación de ejemplo" />
            </Specimen>
            <div className="flex flex-wrap gap-2 border-t border-line pt-5">
              <Button type="submit">Publicar búsqueda</Button>
              <Button variant="ghost">Cancelar</Button>
            </div>
          </form>
        </Panel>
      </Group>

      <Group title="Badge y Notice">
        <div className="flex flex-col gap-3">
          <Panel>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Finalizada</Badge>
              <Badge tone="positive" icon={<CheckIcon />}>
                Cobro confirmado
              </Badge>
              <Badge tone="warning">Para revisar</Badge>
              <Badge tone="negative">Rechazado</Badge>
              <Badge tone="info">Pago informado</Badge>
            </div>
          </Panel>
          <Notice tone="success" title="Búsqueda publicada" />
          <Notice tone="error" title="No pudimos guardar los cambios">
            Revisá tu conexión y probá de nuevo.
          </Notice>
          <Notice tone="warning" title="Esta invitación venció">
            Pedile un link nuevo a Canal Demo.
          </Notice>
          <Notice
            tone="info"
            title="Esta búsqueda ya no recibe postulaciones"
            action={
              <ButtonLink href="/trabajos" size="sm" variant="secondary">
                Ver trabajos
              </ButtonLink>
            }
          />
        </div>
      </Group>

      <Group title="Stat y StatGroup (máximo 3)">
        <StatGroup cols={3} label="Resumen del equipo">
          <Stat label="Vistas aprobadas" value={<Num value={1_626_000} />} />
          <Stat label="Pagado" value={<Money cents={16_820_000} />} />
          <Stat label="Adeudado" value={<Money cents={1_864_000} />} />
        </StatGroup>
      </Group>

      <Group title="Table (stack: fichas en celular)">
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
              {TEAM.map((row) => (
                <TR key={row.name} tone={row.ended ? "muted" : "default"}>
                  <TH scope="row">
                    <span className="flex items-center gap-3">
                      <Avatar name={row.name} className="max-sm:hidden" />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {row.name}
                          {row.waiting > 0 ? <Badge tone="warning">{row.waiting} para revisar</Badge> : null}
                        </span>
                        <span className="block text-[0.8125rem] font-normal text-ink-3">
                          {row.ended ? "Finalizada · " : ""}
                          {row.job}
                        </span>
                      </span>
                    </span>
                  </TH>
                  <TD numeric label="Videos">
                    <Num value={row.videos} compact={false} />
                  </TD>
                  <TD numeric label="Vistas">
                    <Num value={row.views} />
                  </TD>
                  <TD numeric label="Costo / 1.000">
                    <Money cents={row.cpm} decimals="never" />
                  </TD>
                  <TD numeric label="Pagado">
                    <Money cents={row.paid} />
                  </TD>
                  <TD numeric label="Adeudado">
                    <Money cents={row.owed} className={row.owed > 0 ? "font-medium text-ink" : undefined} />
                  </TD>
                </TR>
              ))}
            </TBody>
            <TFoot>
              <TR>
                <TH scope="row">Total</TH>
                <TD />
                <TD numeric label="Vistas">
                  <Num value={1_626_000} />
                </TD>
                <TD />
                <TD numeric label="Pagado">
                  <Money cents={16_820_000} />
                </TD>
                <TD numeric label="Adeudado">
                  <Money cents={1_864_000} />
                </TD>
              </TR>
            </TFoot>
          </Table>
        </Panel>
      </Group>

      <Group title="Disclosure y DisclosureGroup">
        <div className="flex flex-col gap-3">
          <DisclosureGroup>
            <Disclosure title="Liquidaciones" meta={3}>
              <p className="text-sm text-ink-2">Lo que no es la tarea principal de la pantalla va plegado.</p>
            </Disclosure>
            <Disclosure title="Mensajes" meta={2}>
              <p className="text-sm text-ink-2">Los mensajes de la contratación.</p>
            </Disclosure>
            <Disclosure title="Finalizar la contratación">
              <Button size="sm" variant="danger">
                Finalizar contratación
              </Button>
            </Disclosure>
          </DisclosureGroup>
          <Disclosure title="Suelta, con contenedor propio" defaultOpen>
            <p className="text-sm text-ink-2">Una sola sección plegada.</p>
          </Disclosure>
        </div>
      </Group>

      <Group title="Money, Num, Avatar, Rating">
        <Panel>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
            <Specimen name="Money">
              <Money cents={123_450} />
            </Specimen>
            <Specimen name='Money decimals="always"'>
              <Money cents={5_000_000} decimals="always" />
            </Specimen>
            <Specimen name="Money null">
              <Money cents={null} />
            </Specimen>
            <Specimen name="Num">
              <Num value={1_240_000} />
            </Specimen>
            <Specimen name="Num compact={false}">
              <Num value={84_000} compact={false} />
            </Specimen>
            <Specimen name="Avatar">
              <span className="flex items-center gap-2">
                <Avatar name="Brenda Sosa" size="sm" />
                <Avatar name="Canal Demo" size="md" />
                <Avatar name="Tomás Ruiz" size="lg" />
              </span>
            </Specimen>
            <Specimen name="Rating">
              <Rating value={4} />
            </Specimen>
          </div>
        </Panel>
      </Group>

      <Group title="EmptyState">
        <EmptyState title="Todavía no tenés a nadie en el equipo" action={<ButtonLink href="/app/equipo/invitar">Invitar por link</ButtonLink>} />
      </Group>

      <Group title="JobList y JobRow">
        <JobList>
          <JobRow href="/ui-kit" title="Subir recortes del podcast" brandName="Canal Demo" platform="tiktok" payRuleSummary={payRuleText(RULE_CPM)} />
          <JobRow href="/ui-kit" title="Clips del stream: premio por escalón" brandName="Hilo Rojo" platform="youtube" payRuleSummary={payRuleText(RULE_TIERS)} />
        </JobList>
      </Group>

      <Group title="TrackRecord">
        <div className="flex flex-col gap-4">
          <TrackRecord totalViews={3_480_000} avgViews={41_200} approvedDeliverables={84} completedContracts={5} />
          <TrackRecord totalViews={0} avgViews={null} approvedDeliverables={0} completedContracts={0} />
        </div>
      </Group>

      <Group title="PayRuleSummary">
        <div className="grid gap-4 md:grid-cols-3">
          <Panel>
            <PayRuleSummary {...RULE_CPM} />
          </Panel>
          <Panel>
            <PayRuleSummary {...RULE_TIERS} />
          </Panel>
          <Panel>
            <PayRuleSummary {...RULE_FIXED} />
          </Panel>
        </div>
      </Group>

      <Group title="ReviewItem">
        <Panel padded={false}>
          <div className="divide-y divide-line px-4 sm:px-5">
            <ReviewItem authorName="Canal Demo" authorContext="Recortes del podcast" rating={5} comment="Subió todo en fecha y cargó las capturas el mismo día." date="2026-09-12T15:00:00Z" />
            <ReviewItem authorName="Hilo Rojo" authorContext="Clips del stream" rating={4} comment="Buen ritmo de publicación." date="2026-08-02T15:00:00Z" />
          </div>
        </Panel>
      </Group>

      <Group title="PublicHeader y PublicFooter">
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-lg border border-line">
            <PublicHeader user={null} />
          </div>
          <div className="overflow-hidden rounded-lg border border-line [&>footer]:border-t-0">
            <PublicFooter user={null} />
          </div>
        </div>
      </Group>
    </AppShell>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="type-title">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Specimen({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-ink-3">{name}</p>
      <div>{children}</div>
    </div>
  );
}

const SWATCHES = [
  { name: "ink", use: "Texto", className: "bg-ink" },
  { name: "ink-2", use: "Texto secundario", className: "bg-ink-2" },
  { name: "ink-3", use: "Rótulos", className: "bg-ink-3" },
  { name: "ink-4", use: "Decorativo", className: "bg-ink-4" },
  { name: "surface", use: "Fondo", className: "bg-surface" },
  { name: "wash", use: "Gris de apoyo", className: "bg-wash" },
  { name: "wash-2", use: "Hover, relleno", className: "bg-wash-2" },
  { name: "line", use: "Contenedores, filas", className: "bg-line" },
  { name: "line-strong", use: "Controles", className: "bg-line-strong" },
  { name: "accent", use: "Acción, link, foco", className: "bg-accent" },
  { name: "accent-hover", use: "Hover del acento", className: "bg-accent-hover" },
  { name: "accent-soft", use: "Selección", className: "bg-accent-soft" },
  { name: "positive", use: "Texto positivo", className: "bg-positive" },
  { name: "positive-soft", use: "Fondo positivo", className: "bg-positive-soft" },
  { name: "warning", use: "Texto de aviso", className: "bg-warning" },
  { name: "warning-soft", use: "Fondo de aviso", className: "bg-warning-soft" },
  { name: "negative", use: "Texto negativo", className: "bg-negative" },
  { name: "negative-soft", use: "Fondo negativo", className: "bg-negative-soft" },
  { name: "info", use: "Texto informativo", className: "bg-info" },
  { name: "info-soft", use: "Fondo informativo", className: "bg-info-soft" },
];
