import Link from "next/link";
import { ProductPreview } from "@/components/domain/product-preview";
import { ArrowRightIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";

const DOORS = [
  { href: "/registro?rol=contratador", who: "Tengo contenido", action: "Publicar una búsqueda" },
  { href: "/trabajos", who: "Subo videos", action: "Ver búsquedas abiertas" },
];

/** Una pantalla: qué es, una frase, las dos entradas y el producto mismo. */
export default function LandingPage() {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:gap-14 lg:px-8 lg:pt-20 lg:pb-20">
      <section className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-20">
        <div className="flex min-w-0 flex-col gap-5">
          <h1 className="type-display text-[2.375rem] sm:text-5xl lg:text-[3.5rem]">El trabajo de multicuentas, con las cuentas claras.</h1>
          <p className="max-w-[35rem] text-base leading-7 text-ink-2 sm:text-[1.0625rem]">
            Contratadores y gestores se encuentran acá. Acuerdan una regla de pago, se aprueban los videos y las vistas, y lo que le corresponde a cada
            persona se calcula solo.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface shadow-xs">
            {DOORS.map((door) => (
              <li key={door.href}>
                <Link href={door.href} className="group flex items-center justify-between gap-4 px-4 py-3.5 -outline-offset-2 transition-colors duration-100 hover:bg-wash">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[0.8125rem] text-ink-3">{door.who}</span>
                    <span className="text-[0.9375rem] leading-snug font-medium text-ink">{door.action}</span>
                  </span>
                  <ArrowRightIcon className="shrink-0 text-accent transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-[0.8125rem] leading-snug text-ink-3">Los pagos se acuerdan y se hacen entre las partes. Hoy usar {BRAND.name} no tiene costo.</p>
        </div>
      </section>

      <ProductPreview />
    </div>
  );
}
