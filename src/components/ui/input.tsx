import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

export type ControlSize = "sm" | "md";

export type InputProps = Omit<ComponentProps<"input">, "size"> & {
  /**
   * `md` (por defecto): 40px en celular, 36px en escritorio.
   * `sm`: 36px en celular, 32px en escritorio. Solo para controles dentro de celdas de tabla o filas de acción.
   */
  size?: ControlSize;
  /** Adorno fijo a la izquierda, p. ej. "$" o "@". */
  leading?: ReactNode;
  /** Adorno fijo a la derecha, p. ej. "vistas". */
  trailing?: ReactNode;
};

/** Alto y texto por tamaño. En celular el texto nunca baja de 16px: evita el zoom de iOS al enfocar. */
export const controlSizes: Record<ControlSize, { height: string; pad: string; text: string }> = {
  md: { height: "h-10 sm:h-9", pad: "px-3", text: "text-base sm:text-sm" },
  sm: { height: "h-9 sm:h-8", pad: "px-2.5", text: "text-base sm:text-[0.8125rem]" },
};

/** Input nativo. Con `leading`/`trailing` el adorno queda dentro del mismo recuadro. Los numéricos usan numerales tabulares. */
export function Input({ size = "md", leading, trailing, className, type = "text", ...rest }: InputProps) {
  const { height, pad, text } = controlSizes[size];
  const numeric = type === "number" && "tabular-nums";

  if (!leading && !trailing) {
    return <input type={type} className={clsx("control", height, pad, text, numeric, className)} {...rest} />;
  }

  return (
    <div className={clsx("control flex items-center", height, className)}>
      {leading ? <span className={clsx("shrink-0 pr-0 text-ink-3 select-none", pad, text)}>{leading}</span> : null}
      <input
        type={type}
        className={clsx(
          "h-full min-w-0 flex-1 bg-transparent text-ink outline-none disabled:cursor-not-allowed disabled:text-ink-3",
          leading ? "pr-3 pl-1.5" : pad,
          trailing && "pr-1.5",
          text,
          numeric,
        )}
        {...rest}
      />
      {trailing ? <span className={clsx("shrink-0 pl-0 text-[0.8125rem] text-ink-3 select-none", pad)}>{trailing}</span> : null}
    </div>
  );
}
