"use client";

import { createContext, useContext, useState, useTransition, type FormEvent, type ReactNode } from "react";
import clsx from "clsx";
import { Button, type ButtonProps } from "@/components/ui/button";
import { CheckIcon, CrossIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import type { ActionResult } from "@/lib/actions/result";

type Submitter = { name: string; value: string } | null;

const FormContext = createContext<{ pending: boolean; submitter: Submitter }>({ pending: false, submitter: null });

export type ActionFormProps = {
  action: (form: FormData) => Promise<ActionResult | void>;
  children: ReactNode;
  className?: string;
  /** Vacía los campos cuando la acción termina bien (mensajes, reportes). */
  resetOnSuccess?: boolean;
  /**
   * Cómo se muestra el mensaje que devuelve la acción:
   * - `block` (por defecto): un `Notice` a todo el ancho, debajo de los campos. Para formularios completos.
   * - `inline`: una línea de texto chica debajo de los controles. Para formularios en línea
   *   (celdas de tabla, `actions` de un Panel o de un PageHeader), donde un recuadro rompe la fila.
   */
  feedback?: "block" | "inline";
};

/**
 * Formulario de Server Action que muestra el error o la confirmación que devuelve la acción
 * y conserva lo que la persona escribió si hubo un error.
 */
export function ActionForm({ action, children, className, resetOnSuccess = false, feedback = "block" }: ActionFormProps) {
  const [result, setResult] = useState<ActionResult>();
  const [submitter, setSubmitter] = useState<Submitter>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const question = button?.dataset.confirm;
    if (question && !window.confirm(question)) return;

    const data = new FormData(form, button);
    setSubmitter(button?.name ? { name: button.name, value: button.value } : null);
    startTransition(async () => {
      const outcome = (await action(data)) ?? undefined;
      setResult(outcome);
      if (resetOnSuccess && !(outcome && "error" in outcome)) form.reset();
    });
  }

  const failed = Boolean(result && "error" in result);
  const message = result ? ("error" in result ? result.error : result.ok) : null;

  return (
    <form onSubmit={onSubmit} className={className}>
      <FormContext.Provider value={{ pending, submitter }}>{children}</FormContext.Provider>
      {/* `basis-full`: en formularios con `flex flex-wrap` el mensaje baja a su propia línea en vez de meterse entre los botones. */}
      {message && feedback === "block" ? (
        <Notice tone={failed ? "error" : "success"} title={message} className="col-span-full w-full basis-full" />
      ) : null}
      {message && feedback === "inline" ? (
        <p
          role={failed ? "alert" : "status"}
          className={clsx(
            "col-span-full flex w-full max-w-sm basis-full items-start gap-1.5 text-left text-[0.8125rem] leading-snug font-medium whitespace-normal [&>svg]:mt-0.5 [&>svg]:size-3.5 [&>svg]:shrink-0",
            failed ? "text-negative" : "text-positive",
          )}
        >
          {failed ? <CrossIcon /> : <CheckIcon />}
          {message}
        </p>
      ) : null}
    </form>
  );
}

export type FormSubmitProps = Omit<ButtonProps, "type" | "pending"> & {
  /** Pregunta de confirmación antes de enviar, para acciones que no se deshacen. */
  confirm?: string;
};

/** Botón de envío de un `ActionForm`. Con varios botones, solo el apretado muestra la espera. */
export function FormSubmit({ name, value, confirm, disabled, ...rest }: FormSubmitProps) {
  const { pending, submitter } = useContext(FormContext);
  const mine = pending && (name ? submitter?.name === name && submitter.value === String(value ?? "") : true);
  return (
    <Button
      type="submit"
      name={name}
      value={value}
      pending={mine}
      disabled={disabled || pending}
      data-confirm={confirm}
      {...rest}
    />
  );
}
