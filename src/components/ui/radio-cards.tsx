import clsx from "clsx";
import { useId, type ReactNode } from "react";

export type RadioCardOption = {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

export type RadioCardsProps = {
  /** Nombre del campo en el FormData. */
  name: string;
  /** Pregunta que responde el grupo. Es el <legend>. */
  legend: ReactNode;
  options: RadioCardOption[];
  /** Opción marcada al cargar (formulario no controlado). */
  defaultValue?: string;
  hint?: ReactNode;
  error?: string | string[] | null;
  required?: boolean;
  /** 1 = apiladas; 2 o 3 = en columnas desde tablet. En celular siempre se apilan. 4 = de a dos en celular. */
  columns?: 1 | 2 | 3 | 4;
  className?: string;
};

const COLUMNS: Record<NonNullable<RadioCardsProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

/**
 * Elección única entre pocas opciones (rol al registrarse, tipo de regla de
 * pago). Son radios nativos: funcionan sin JavaScript, con teclado y dentro
 * de un <form> de Server Action.
 */
export function RadioCards({
  name,
  legend,
  options,
  defaultValue,
  hint,
  error,
  required = false,
  columns = 1,
  className,
}: RadioCardsProps) {
  const baseId = useId();
  const hintId = `${baseId}-ayuda`;
  const errorId = `${baseId}-error`;
  const errors = error == null ? [] : Array.isArray(error) ? error.filter(Boolean) : [error];
  const hasError = errors.length > 0;
  const describedBy = [hint ? hintId : null, hasError ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset className={clsx("flex min-w-0 flex-col gap-1.5", className)} aria-describedby={describedBy}>
      <legend className="mb-1.5 text-[0.8125rem] leading-[1.125rem] font-medium text-ink">{legend}</legend>
      <div className={clsx("grid gap-2", COLUMNS[columns])}>
        {options.map((option) => (
          <label
            key={option.value}
            className={clsx(
              "focus-within-ring flex cursor-pointer items-start gap-2.5 rounded-md border bg-surface px-3 py-2.5 shadow-xs transition-colors duration-100",
              "hover:border-ink-4 has-checked:border-accent has-checked:bg-accent-soft has-checked:shadow-[inset_0_0_0_1px_var(--color-accent)]",
              "has-disabled:cursor-not-allowed has-disabled:border-line has-disabled:bg-wash has-disabled:text-ink-3 has-disabled:shadow-none",
              hasError ? "border-negative" : "border-line-strong",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={defaultValue === option.value}
              required={required}
              disabled={option.disabled}
              className="mt-0.5 size-4 shrink-0 appearance-none rounded-full border border-line-strong bg-surface outline-none checked:border-[5px] checked:border-accent focus-visible:outline-none disabled:border-line"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm leading-5 font-medium">{option.title}</span>
              {option.description ? <span className="text-[0.8125rem] leading-snug text-ink-2">{option.description}</span> : null}
            </span>
          </label>
        ))}
      </div>
      {hint ? (
        <p id={hintId} className="text-[0.8125rem] leading-snug text-ink-3">
          {hint}
        </p>
      ) : null}
      {hasError ? (
        <p id={errorId} className="text-[0.8125rem] leading-snug font-medium text-negative">
          {errors.join(" ")}
        </p>
      ) : null}
    </fieldset>
  );
}
