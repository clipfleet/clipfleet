import clsx from "clsx";
import { BrandMark } from "@/components/shell/wordmark";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { BriefcaseIcon, LayersIcon, ReceiptIcon, SearchIcon, SendIcon, TeamIcon } from "@/components/ui/icons";
import { Money } from "@/components/ui/money";
import { Num } from "@/components/ui/num";
import { Panel } from "@/components/ui/panel";
import { Stat, StatGroup } from "@/components/ui/stat";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { BRAND } from "@/lib/brand";
import type { ReactNode } from "react";

// Datos ficticios, solo para mostrar la pantalla. Montos en centavos.
const TEAM = [
  { name: "Brenda Sosa", job: "Recortes del podcast", waiting: 2, ended: false, videos: 42, views: 1_240_000, paid: 12_150_000, owed: 1_864_000 },
  { name: "Micaela Paz", job: "Recortes del podcast", waiting: 0, ended: false, videos: 31, views: 742_000, paid: 7_790_000, owed: 920_000 },
  { name: "Tomás Ruiz", job: "Clips del stream", waiting: 0, ended: false, videos: 18, views: 386_000, paid: 4_670_000, owed: 0 },
  { name: "Julián Vera", job: "Clips del stream", waiting: 0, ended: true, videos: 12, views: 95_000, paid: 1_330_000, owed: 0 },
];

const TOTALS = TEAM.reduce((sum, row) => ({ views: sum.views + row.views, paid: sum.paid + row.paid, owed: sum.owed + row.owed }), { views: 0, paid: 0, owed: 0 });
const costPerThousand = (paid: number, views: number) => Math.round((paid * 1000) / views);

// Las mismas secciones que la barra lateral del contratador.
const HIRER_NAV: NavSection[] = [
  {
    group: "Gestión",
    items: [
      { label: "Contratados", icon: <TeamIcon />, active: true, badge: 2 },
      { label: "Liquidaciones", icon: <ReceiptIcon />, active: false },
    ],
  },
  {
    group: "Contratar",
    items: [
      { label: "Campañas", icon: <LayersIcon />, active: false, badge: 0 },
      { label: "Talento", icon: <SearchIcon />, active: false, badge: 0 },
    ],
  },
];

// Los trabajos de quien sube videos, también ficticios.
const JOBS = [
  { title: "Recortes del podcast", brand: "Charla Abierta", toDeliver: 2, toConfirm: false, ended: false, videos: 42, views: 1_240_000, paid: 12_150_000, owed: 1_864_000 },
  { title: "Clips del stream", brand: "Fede en Vivo", toDeliver: 0, toConfirm: true, ended: false, videos: 27, views: 618_000, paid: 5_420_000, owed: 980_000 },
  { title: "Highlights de la fecha", brand: "Tribuna Media", toDeliver: 0, toConfirm: false, ended: true, videos: 15, views: 214_000, paid: 2_310_000, owed: 0 },
];

const JOB_TOTALS = JOBS.reduce((sum, row) => ({ views: sum.views + row.views, paid: sum.paid + row.paid, owed: sum.owed + row.owed }), { views: 0, paid: 0, owed: 0 });

// Las mismas secciones que la barra lateral de quien sube videos.
const WORKER_NAV: NavSection[] = [
  {
    group: "Trabajo",
    items: [
      { label: "Mis trabajos", icon: <BriefcaseIcon />, active: true, badge: 2 },
      { label: "Cobros", icon: <ReceiptIcon />, active: false, badge: 1 },
    ],
  },
  {
    group: "Buscar trabajo",
    items: [
      { label: "Campañas", icon: <SearchIcon />, active: false },
      { label: "Postulaciones", icon: <SendIcon />, active: false },
    ],
  },
];

type NavSection = { group: string; items: { label: string; icon: ReactNode; active: boolean; badge?: number }[] };

/**
 * Pantallas del panel armadas con los componentes reales y datos ficticios,
 * enmarcadas como captura de producto. Solo para la landing. Son imágenes:
 * van `inert` (no reciben foco ni clics) y las describe el epígrafe.
 */
export function ProductPreview({ side, className }: { side: "hirer" | "worker"; className?: string }) {
  return side === "hirer" ? (
    <PreviewFrame nav={HIRER_NAV} caption="Contratados de un canal, con datos ficticios." className={className}>
      <HirerScreen />
    </PreviewFrame>
  ) : (
    <PreviewFrame nav={WORKER_NAV} caption="Los trabajos de quien sube videos, con datos ficticios." className={className}>
      <WorkerScreen />
    </PreviewFrame>
  );
}

function PreviewFrame({ nav, caption, className, children }: { nav: NavSection[]; caption: string; className?: string; children: ReactNode }) {
  return (
    <figure className={clsx("flex min-w-0 flex-col gap-3", className)}>
      <figcaption className="flex items-center gap-2.5 text-[0.8125rem] text-ink-3">
        <Badge>Ejemplo</Badge>
        {caption}
      </figcaption>

      <div inert className="grid overflow-hidden rounded-lg border border-line bg-surface shadow-raised select-none lg:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="hidden flex-col gap-1 border-r border-line bg-wash px-3 py-4 lg:flex">
          <p className="mb-3 flex items-center gap-2 px-2 text-[0.9375rem] leading-none font-semibold tracking-[-0.03em]">
            <BrandMark className="size-4" />
            {BRAND.name}
          </p>
          {nav.map((section) => (
            <div key={section.group} className="mb-3 flex flex-col gap-1">
              <p className="px-2.5 text-xs font-medium text-ink-3">{section.group}</p>
              {section.items.map((item) => (
                <p
                  key={item.label}
                  className={clsx(
                    "flex h-8 items-center gap-2.5 rounded-md border px-2.5 text-[0.8125rem] font-medium",
                    item.active ? "border-line bg-surface text-ink shadow-xs" : "border-transparent text-ink-2",
                  )}
                >
                  <span className={clsx("flex", item.active ? "text-accent" : "text-ink-3")}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-soft px-1.5 text-xs leading-none text-accent tabular-nums">{item.badge}</span>
                  ) : null}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">{children}</div>
      </div>
    </figure>
  );
}

function HirerScreen() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xl leading-7 font-semibold tracking-[-0.02em]">Contratados</p>
        <div className="hidden gap-2 sm:flex">
          <span className={buttonClasses({ variant: "secondary", size: "sm" })}>Invitar por link</span>
          <span className={buttonClasses({ size: "sm" })}>Liquidar lo adeudado</span>
        </div>
      </div>

      <StatGroup cols={3}>
        <Stat label="Vistas aprobadas" value={<Num value={TOTALS.views} />} />
        <Stat label="Pagado" value={<Money cents={TOTALS.paid} />} />
        <Stat label="Adeudado" value={<Money cents={TOTALS.owed} />} />
      </StatGroup>

      <Panel padded={false}>
        <Table caption="Ejemplo: rendimiento por persona" minWidth={0}>
          <THead>
            <TR>
              <TH>Persona</TH>
              <TH numeric hideBelow="md">
                Videos
              </TH>
              <TH numeric>Vistas</TH>
              <TH numeric hideBelow="md">
                Costo / 1.000
              </TH>
              <TH numeric hideBelow="sm">
                Pagado
              </TH>
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
                <TD numeric hideBelow="md">
                  <Num value={row.videos} compact={false} />
                </TD>
                <TD numeric>
                  <Num value={row.views} />
                </TD>
                <TD numeric hideBelow="md">
                  <Money cents={costPerThousand(row.paid, row.views)} decimals="never" />
                </TD>
                <TD numeric hideBelow="sm">
                  <Money cents={row.paid} />
                </TD>
                <TD numeric className={row.owed > 0 ? "font-medium text-ink" : undefined}>
                  <Money cents={row.owed} />
                </TD>
              </TR>
            ))}
          </TBody>
          <TFoot>
            <TR>
              <TH scope="row">Total</TH>
              <TD hideBelow="md" />
              <TD numeric>
                <Num value={TOTALS.views} />
              </TD>
              <TD numeric hideBelow="md">
                <Money cents={costPerThousand(TOTALS.paid, TOTALS.views)} decimals="never" />
              </TD>
              <TD numeric hideBelow="sm">
                <Money cents={TOTALS.paid} />
              </TD>
              <TD numeric>
                <Money cents={TOTALS.owed} />
              </TD>
            </TR>
          </TFoot>
        </Table>
      </Panel>
    </>
  );
}

function WorkerScreen() {
  return (
    <>
      <p className="text-xl leading-7 font-semibold tracking-[-0.02em]">Mis trabajos</p>

      <StatGroup cols={3}>
        <Stat label="Vistas aprobadas" value={<Num value={JOB_TOTALS.views} />} />
        <Stat label="Cobrado" value={<Money cents={JOB_TOTALS.paid} />} />
        <Stat label="A cobrar" value={<Money cents={JOB_TOTALS.owed} />} />
      </StatGroup>

      <Panel padded={false}>
        <Table caption="Ejemplo: trabajos y cobros" minWidth={0}>
          <THead>
            <TR>
              <TH>Trabajo</TH>
              <TH numeric hideBelow="md">
                Videos
              </TH>
              <TH numeric>Vistas</TH>
              <TH numeric hideBelow="sm">
                Cobrado
              </TH>
              <TH numeric>A cobrar</TH>
            </TR>
          </THead>
          <TBody>
            {JOBS.map((row) => (
              <TR key={row.title} tone={row.ended ? "muted" : "default"}>
                <TH scope="row">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {row.title}
                    {row.toDeliver > 0 ? <Badge tone="warning">{row.toDeliver} por entregar</Badge> : null}
                    {row.toConfirm ? <Badge tone="warning">Pago por confirmar</Badge> : null}
                  </span>
                  <span className="block text-[0.8125rem] font-normal text-ink-3">
                    {row.ended ? "Finalizada · " : ""}
                    {row.brand}
                  </span>
                </TH>
                <TD numeric hideBelow="md">
                  <Num value={row.videos} compact={false} />
                </TD>
                <TD numeric>
                  <Num value={row.views} />
                </TD>
                <TD numeric hideBelow="sm">
                  <Money cents={row.paid} />
                </TD>
                <TD numeric className={row.owed > 0 ? "font-medium text-ink" : undefined}>
                  <Money cents={row.owed} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Panel>
    </>
  );
}
