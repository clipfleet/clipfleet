import clsx from "clsx";
import type { ReactNode } from "react";

export type Tone = "neutral" | "positive" | "warning" | "negative" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-wash-2 text-ink-2",
  positive: "bg-positive-soft text-positive",
  warning: "bg-warning-soft text-warning",
  negative: "bg-negative-soft text-negative",
  info: "bg-info-soft text-info",
};

export type BadgeProps = {
  children: ReactNode;
  tone?: Tone;
  /** Ícono chico antes del texto (de `ui/icons`). */
  icon?: ReactNode;
  className?: string;
};

/**
 * Estado de una cosa (postulación sin responder, video aprobado, pago informado).
 * Una píldora de fondo tenue: el texto dice el estado; el color solo acompaña.
 */
export function Badge({ children, tone = "neutral", icon, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex h-[1.375rem] shrink-0 items-center gap-1 rounded-full px-2 text-xs leading-none font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {icon ? <span className="-ml-0.5 flex [&>svg]:size-3">{icon}</span> : null}
      {children}
    </span>
  );
}
