import clsx from "clsx";
import type { ComponentProps } from "react";

export type TextareaProps = ComponentProps<"textarea">;

/** Textarea nativo. Arranca en 4 líneas; el usuario puede agrandarlo hacia abajo. */
export function Textarea({ className, rows = 4, ...rest }: TextareaProps) {
  return <textarea rows={rows} className={clsx("control min-h-20 resize-y px-3 py-2 text-base leading-normal sm:text-sm sm:leading-normal", className)} {...rest} />;
}
