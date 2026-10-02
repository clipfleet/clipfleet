import clsx from "clsx";
import type { ReactNode } from "react";

export type EmptyStateProps = {
  /** Qué falta, dicho como hecho: "Todavía no publicaste ninguna búsqueda". */
  title: ReactNode;
  /** Solo si el siguiente paso no se entiende con el botón. */
  description?: ReactNode;
  /** El siguiente paso: un <ButtonLink> o <Button>. */
  action?: ReactNode;
  /** Sin fondo propio: para usar dentro de un <Panel padded={false}>. */
  flush?: boolean;
  className?: string;
};

/** Pantalla o panel sin datos: una línea y, si existe, el siguiente paso. Sin ilustración. */
export function EmptyState({ title, description, action, flush = false, className }: EmptyStateProps) {
  return (
    <div className={clsx("flex flex-col items-center gap-4 px-6 text-center", flush ? "py-10" : "rounded-lg bg-wash py-14", className)}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        {description ? <p className="max-w-prose text-sm text-ink-2">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
