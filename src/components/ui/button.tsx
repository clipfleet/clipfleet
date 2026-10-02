import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md border font-medium whitespace-nowrap select-none transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-50 data-pending:opacity-80";

const VARIANTS: Record<ButtonVariant, string> = {
  // La acción principal de la pantalla. Una sola por vista.
  primary: "border-accent bg-accent text-white shadow-xs hover:border-accent-hover hover:bg-accent-hover disabled:hover:border-accent disabled:hover:bg-accent",
  secondary: "border-line-strong bg-surface text-ink shadow-xs hover:bg-wash active:bg-wash-2 disabled:hover:bg-surface",
  ghost: "border-transparent bg-transparent text-ink-2 hover:bg-wash-2 hover:text-ink disabled:hover:bg-transparent",
  danger: "border-line-strong bg-surface text-negative shadow-xs hover:border-negative-line hover:bg-negative-soft disabled:hover:border-line-strong disabled:hover:bg-surface",
};

const SIZES: Record<ButtonSize, string> = {
  // En pantallas táctiles suben un escalón de alto.
  sm: "h-9 px-3 text-[0.8125rem] sm:h-8",
  md: "h-10 px-3.5 text-sm sm:h-9",
  lg: "h-11 px-5 text-[0.9375rem]",
};

export function buttonClasses(options: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}): string {
  const { variant = "primary", size = "md", block = false, className } = options;
  return clsx(BASE, VARIANTS[variant], SIZES[size], block && "w-full", className);
}

export type ButtonProps = Omit<ComponentProps<"button">, "children"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
  /** Estado de espera: deshabilita el botón y muestra el indicador. */
  pending?: boolean;
  /** Texto mientras está en espera, p. ej. "Publicando…". Si falta, se mantiene el texto original. */
  pendingLabel?: ReactNode;
};

/**
 * Botón nativo. Acepta todo lo de <button>: `type`, `disabled`, `name`, `value`, `formAction`…
 * Por defecto es `type="button"`: en formularios usá <FormSubmit> dentro de un <ActionForm>.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  block,
  pending = false,
  pendingLabel,
  disabled,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      data-pending={pending || undefined}
      className={buttonClasses({ variant, size, block, className })}
      {...rest}
    >
      {pending ? (
        <span aria-hidden="true" className="size-3.5 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-r-transparent" />
      ) : null}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

/** Link con aspecto de botón. Para navegar; si la acción muta datos, va un <FormSubmit> dentro de un <ActionForm>. */
export function ButtonLink({ children, variant = "primary", size = "md", block, className, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, block, className })} {...rest}>
      {children}
    </Link>
  );
}
