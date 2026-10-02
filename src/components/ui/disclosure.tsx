import clsx from "clsx";
import type { ReactNode } from "react";
import { ChevronDownIcon } from "./icons";

export type DisclosureProps = {
  /** Rótulo del resumen: lo único que se ve cerrado. */
  title: ReactNode;
  /** Dato corto junto al rótulo: una cantidad. */
  meta?: ReactNode;
  children: ReactNode;
  /** Abierto al cargar. Usalo solo si adentro hay algo que espera una acción. */
  defaultOpen?: boolean;
  /**
   * `panel` (por defecto): con contenedor propio, para secciones secundarias de una pantalla.
   * Varias seguidas van dentro de <DisclosureGroup>.
   * `plain`: sin contenedor, para "Más opciones" dentro de un formulario.
   */
  variant?: "panel" | "plain";
  className?: string;
};

/**
 * Sección plegada (<details> nativo, sin JavaScript). Para lo que no es la
 * tarea principal de la pantalla. Los campos de formulario que queden adentro
 * se envían igual aunque esté cerrada.
 */
export function Disclosure({ title, meta, children, defaultOpen = false, variant = "panel", className }: DisclosureProps) {
  const panel = variant === "panel";
  return (
    <details open={defaultOpen} className={clsx("group/disclosure min-w-0", panel && "rounded-lg border border-line bg-surface", className)}>
      <summary
        className={clsx(
          "flex cursor-pointer list-none items-center gap-2 select-none [&::-webkit-details-marker]:hidden",
          panel
            ? "justify-between rounded-lg px-4 py-3.5 transition-colors duration-100 hover:bg-wash group-open/disclosure:rounded-b-none sm:px-5"
            : "w-fit rounded-sm text-[0.8125rem] font-medium text-ink-2 hover:text-ink",
        )}
      >
        <span className={clsx("flex min-w-0 items-baseline gap-2", panel && "text-sm font-medium text-ink")}>
          {title}
          {meta !== undefined && meta !== null ? <span className="text-[0.8125rem] font-normal text-ink-3 tabular-nums">{meta}</span> : null}
        </span>
        <ChevronDownIcon className={clsx("shrink-0 transition-transform duration-150 group-open/disclosure:rotate-180", panel ? "text-ink-3" : "size-3.5")} />
      </summary>
      <div className={clsx(panel ? "border-t border-line p-4 sm:p-5" : "pt-4")}>{children}</div>
    </details>
  );
}

/** Varias secciones plegadas seguidas, en un solo contenedor con divisores. */
export function DisclosureGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface",
        "[&>details]:rounded-none [&>details]:border-0 [&>details>summary]:rounded-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
