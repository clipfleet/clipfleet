import clsx from "clsx";
import type { ReactNode } from "react";

export type PanelProps = {
  children: ReactNode;
  /** Título del panel. Con título, el panel es una <section> rotulada. */
  title?: ReactNode;
  /** Una línea debajo del título. */
  description?: ReactNode;
  /** Acciones a la derecha del título (botones `sm`, links). */
  actions?: ReactNode;
  /** Pie del panel: totales, nota. */
  footer?: ReactNode;
  /**
   * `true` (por defecto) agrega padding al cuerpo. Usá `false` cuando el cuerpo
   * es una <Table> o una lista que llega hasta los bordes.
   */
  padded?: boolean;
  /** Nivel del encabezado del título. Por defecto h2. */
  headingLevel?: 2 | 3 | 4;
  id?: string;
  className?: string;
};

/**
 * Contenedor: línea fina, esquinas de 10px, sin sombra. Agrupa una tabla, un
 * formulario o un bloque secundario. No se anidan.
 */
export function Panel({
  children,
  title,
  description,
  actions,
  footer,
  padded = true,
  headingLevel = 2,
  id,
  className,
}: PanelProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const hasHeader = Boolean(title || actions);
  const Tag = title ? "section" : "div";

  return (
    <Tag id={id} className={clsx("min-w-0 overflow-hidden rounded-lg border border-line bg-surface", className)}>
      {hasHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title ? <Heading className="type-title">{title}</Heading> : null}
            {description ? <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-3">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={clsx(padded && "p-4 sm:p-5")}>{children}</div>
      {footer ? <div className="border-t border-line bg-wash px-4 py-3 text-[0.8125rem] text-ink-2 sm:px-5">{footer}</div> : null}
    </Tag>
  );
}
