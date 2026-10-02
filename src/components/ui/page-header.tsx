import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "./icons";

export type PageHeaderProps = {
  /** Título de la pantalla. Es el único <h1>. */
  title: ReactNode;
  /** Solo si evita un error real. */
  description?: ReactNode;
  /** Botones a la derecha (debajo, en celular). La acción principal va última. */
  actions?: ReactNode;
  /** Link para volver al listado padre, en pantallas de detalle. */
  back?: { href: string; label: string };
  /** Badges o datos cortos debajo del título: estado, quién contrata, regla de pago. */
  meta?: ReactNode;
  className?: string;
};

/** Encabezado de página: una vez por pantalla, arriba de todo. */
export function PageHeader({ title, description, actions, back, meta, className }: PageHeaderProps) {
  return (
    <header className={clsx("flex flex-col gap-3", className)}>
      {back ? (
        <Link href={back.href} className="-ml-0.5 inline-flex items-center gap-1.5 self-start rounded-sm text-[0.8125rem] font-medium text-ink-3 transition-colors duration-100 hover:text-ink">
          <ArrowLeftIcon className="size-3.5" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="type-page">{title}</h1>
          {meta ? <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-ink-2">{meta}</div> : null}
          {description ? <p className="max-w-prose text-sm text-ink-2">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-start gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
