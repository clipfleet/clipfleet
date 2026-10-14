import Link from "next/link";
import { PreviewTabs } from "@/components/domain/preview-tabs";
import { ProductPreview } from "@/components/domain/product-preview";
import { ArrowRightIcon } from "@/components/ui/icons";

const DOORS = [
  {
    href: "/registro?rol=contratador",
    who: "Tengo contenido",
    outcome: "Multiplicá las vistas de tu contenido",
    how: "Publicá una campaña, elegí quién sube tus clips y pagá solo por las vistas que aprobás.",
    action: "Publicar una campaña",
  },
  {
    href: "/trabajos",
    who: "Subo videos",
    outcome: "Cobrá por cada vista que generás",
    how: "Elegí una campaña, subí los videos y la plataforma calcula lo que te corresponde.",
    action: "Ver campañas abiertas",
  },
];

/** Una pantalla: lo que gana cada lado, las dos entradas y el producto mismo. */
export default function LandingPage() {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:gap-14 lg:px-8 lg:pt-20 lg:pb-20">
      <section className="flex flex-col gap-9 lg:gap-10">
        <h1 className="type-display max-w-[48rem] text-[2.375rem] sm:text-5xl lg:text-[3.5rem]">Tu contenido en más pantallas. Tus videos, convertidos en ingresos.</h1>

        <div className="flex flex-col gap-3">
          <ul className="grid gap-4 md:grid-cols-2">
            {DOORS.map((door) => (
              <li key={door.href} className="flex">
                <Link
                  href={door.href}
                  className="group flex flex-1 flex-col gap-2 rounded-lg border border-line bg-surface p-5 shadow-xs transition-colors duration-100 hover:border-line-strong sm:p-6"
                >
                  <span className="text-[0.8125rem] text-ink-3">{door.who}</span>
                  <span className="text-xl leading-7 font-semibold tracking-[-0.02em] text-ink">{door.outcome}</span>
                  <span className="text-[0.9375rem] leading-6 text-ink-2">{door.how}</span>
                  <span className="mt-auto flex items-center gap-1.5 pt-3 text-[0.9375rem] font-medium text-accent">
                    {door.action}
                    <ArrowRightIcon className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-[0.8125rem] leading-snug text-ink-3">Gratis por ahora. Los pagos se hacen directo entre las partes.</p>
        </div>
      </section>

      <PreviewTabs
        label="Ver el panel de"
        tabs={[
          { label: "Tengo contenido", panel: <ProductPreview side="hirer" /> },
          { label: "Subo videos", panel: <ProductPreview side="worker" /> },
        ]}
      />
    </div>
  );
}
