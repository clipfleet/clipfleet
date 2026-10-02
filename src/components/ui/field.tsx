import clsx from "clsx";
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

type ControlProps = {
  id?: string;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export type FieldProps = {
  /** Texto del label. Siempre visible: no se reemplaza por placeholder. */
  label: ReactNode;
  /** Ayuda corta debajo del control. Solo si evita un error. */
  hint?: ReactNode;
  /** Mensaje(s) de error del servidor. Acepta el string[] que devuelve Zod. */
  error?: string | string[] | null;
  /** Marca "opcional" al lado del label. Los campos son obligatorios salvo que se diga. */
  optional?: boolean;
  /** Id del control. Si falta, se genera uno. */
  id?: string;
  className?: string;
  /** Un único control: <Input>, <Textarea> o <Select>. */
  children: ReactNode;
};

/**
 * Envuelve un control con label, ayuda y error, y los asocia (for/id,
 * aria-describedby, aria-invalid) sin JavaScript de cliente: sirve tal cual
 * en formularios de Server Actions.
 */
export function Field({ label, hint, error, optional = false, id, className, children }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-ayuda`;
  const errorId = `${controlId}-error`;

  const errors = error == null ? [] : Array.isArray(error) ? error.filter(Boolean) : [error];
  const hasError = errors.length > 0;
  const describedBy = [hint ? hintId : null, hasError ? errorId : null].filter(Boolean).join(" ") || undefined;

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<ControlProps>, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": hasError || undefined,
      })
    : children;

  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={controlId} className="text-[0.8125rem] leading-[1.125rem] font-medium text-ink">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-ink-3">opcional</span> : null}
      </label>
      {control}
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
    </div>
  );
}
