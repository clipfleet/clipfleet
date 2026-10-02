import clsx from "clsx";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

type Breakpoint = "sm" | "md" | "lg" | "xl";
type Align = "left" | "right" | "center";

const HIDE_BELOW: Record<Breakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

const ALIGN: Record<Align, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export type TableProps = Omit<ComponentProps<"table">, "children"> & {
  children: ReactNode;
  /** Qué muestra la tabla. Se lee como <caption> (oculto a la vista) y rotula la zona con scroll. */
  caption: string;
  /**
   * Estrategia en celular:
   * - `scroll` (por defecto): la tabla sigue siendo tabla. Para listas cortas de pocas columnas; con
   *   `minWidth={0}` y `hideBelow` en las columnas secundarias entra en 375px sin scroll.
   * - `stack`: debajo de 640px cada fila pasa a ser una ficha con "rótulo — valor" (requiere `label` en cada TD).
   */
  layout?: "scroll" | "stack";
  /** Ancho mínimo de la tabla cuando es tabla, en px. Por defecto 640. */
  minWidth?: number;
};

/**
 * Tabla de datos. Semántica real (<table>, <th scope>), divisores suaves entre
 * filas, encabezados discretos y números a la derecha con numerales tabulares.
 */
export function Table({ children, caption, layout = "scroll", minWidth = 640, className, style, ...rest }: TableProps) {
  const stack = layout === "stack";
  return (
    <div role="region" aria-label={caption} tabIndex={0} className={clsx("w-full", stack ? "sm:overflow-x-auto" : "overflow-x-auto")}>
      <table
        role="table"
        className={clsx("w-full border-collapse text-left text-sm", stack ? "table-stack sm:min-w-(--table-min)" : "min-w-(--table-min)", className)}
        style={{ "--table-min": `${minWidth}px`, ...style } as CSSProperties}
        {...rest}
      >
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function THead({ className, ...rest }: ComponentProps<"thead">) {
  return <thead role="rowgroup" className={className} {...rest} />;
}

export function TBody({ className, ...rest }: ComponentProps<"tbody">) {
  return <tbody role="rowgroup" className={clsx("[&>tr:last-child>*]:border-b-0", className)} {...rest} />;
}

/** Pie con totales. Va después de TBody. */
export function TFoot({ className, ...rest }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      role="rowgroup"
      className={clsx("font-medium [&>tr>*]:border-t [&>tr>*]:border-b-0 [&>tr>*]:border-line [&>tr>*]:bg-wash", className)}
      {...rest}
    />
  );
}

export type TRProps = ComponentProps<"tr"> & {
  /** `muted` atenúa la fila: lo finalizado, lo vencido, lo que ya no admite acción. */
  tone?: "default" | "muted";
};

export function TR({ tone = "default", className, ...rest }: TRProps) {
  return <tr role="row" data-tone={tone} className={clsx("group/row", tone === "muted" && "text-ink-3", className)} {...rest} />;
}

type CellOptions = {
  /** Alineación. `numeric` implica derecha. */
  align?: Align;
  /** Columna de números o plata: derecha + numerales tabulares. */
  numeric?: boolean;
  /** Oculta la columna debajo de ese ancho de pantalla (solo en `layout="scroll"`; en fichas se muestra igual). */
  hideBelow?: Breakpoint;
};

function cellClasses({ align, numeric, hideBelow }: CellOptions): string {
  return clsx(ALIGN[align ?? (numeric ? "right" : "left")], numeric && "whitespace-nowrap tabular-nums", hideBelow && HIDE_BELOW[hideBelow]);
}

const CELL_PAD = "px-2.5 first:pl-4 last:pr-4 sm:px-3 sm:first:pl-5 sm:last:pr-5";

export type THProps = Omit<ComponentProps<"th">, "align"> &
  CellOptions & {
    /** Ancho fijo de la columna, p. ej. "8rem". */
    width?: string;
  };

/** Encabezado de columna. Dentro de TBody, con `scope="row"`, es el encabezado de la fila. */
export function TH({ align, numeric, hideBelow, width, scope = "col", className, style, ...rest }: THProps) {
  const isRowHeader = scope === "row";
  return (
    <th
      role={isRowHeader ? "rowheader" : "columnheader"}
      scope={scope}
      className={clsx(
        CELL_PAD,
        "border-b border-line",
        isRowHeader
          ? "py-3 align-middle font-medium text-ink group-data-[tone=muted]/row:text-ink-2 sm:group-hover/row:bg-wash"
          : "h-10 py-0 align-middle text-xs font-medium whitespace-nowrap text-ink-3",
        cellClasses({ align, numeric: isRowHeader ? numeric : false, hideBelow }),
        !isRowHeader && numeric && "text-right",
        className,
      )}
      style={width ? { width, ...style } : style}
      {...rest}
    />
  );
}

export type TDProps = Omit<ComponentProps<"td">, "align"> &
  CellOptions & {
    /** Rótulo de la celda en modo `stack` (normalmente, el mismo texto del TH). */
    label?: string;
    /** En modo `stack`, esta celda es el título de la ficha. */
    primary?: boolean;
    /** Celda de botones. En modo `stack` va al final, a la izquierda. */
    actions?: boolean;
    /** Texto secundario. */
    muted?: boolean;
  };

export function TD({ align, numeric, hideBelow, label, primary, actions, muted, className, ...rest }: TDProps) {
  return (
    <td
      role="cell"
      data-label={label}
      data-primary={primary || undefined}
      data-actions={actions || undefined}
      className={clsx(
        CELL_PAD,
        "border-b border-line py-3 align-middle sm:group-hover/row:bg-wash",
        cellClasses({ align, numeric, hideBelow }),
        muted && "text-ink-3",
        className,
      )}
      {...rest}
    />
  );
}
