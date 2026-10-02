import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { controlSizes, type ControlSize } from "./input";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<ComponentProps<"select">, "children" | "size"> & {
  /** `sm`: 32px en escritorio, para selects dentro de celdas de tabla o filas de acción. */
  size?: ControlSize;
  /** Opciones como datos. Alternativa: pasar <option> como children. */
  options?: SelectOption[];
  /** Primera opción vacía, p. ej. "Elegí una opción". */
  placeholder?: string;
  children?: ReactNode;
};

const CHEVRON =
  "bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22%20fill=%22none%22%20stroke=%22%23646c76%22%20stroke-width=%221.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m4%206%204%204%204-4%22/%3E%3C/svg%3E')] bg-[length:1rem] bg-no-repeat";

/** Select nativo del sistema operativo: en el celular abre el selector propio del teléfono. */
export function Select({ size = "md", options, placeholder, children, className, ...rest }: SelectProps) {
  const { height, text } = controlSizes[size];
  return (
    <select
      className={clsx(
        "control appearance-none",
        CHEVRON,
        height,
        text,
        size === "sm" ? "bg-[right_0.5rem_center] pr-8 pl-2.5" : "bg-[right_0.625rem_center] pr-9 pl-3",
        className,
      )}
      {...rest}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options
        ? options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))
        : children}
    </select>
  );
}
