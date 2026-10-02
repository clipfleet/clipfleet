import clsx from "clsx";
import type { ReactNode } from "react";
import { AlertIcon, CheckIcon, CrossIcon, InfoIcon } from "./icons";

export type NoticeTone = "success" | "error" | "warning" | "info";

export type NoticeProps = {
  tone?: NoticeTone;
  /** Qué pasó, en una línea. */
  title?: ReactNode;
  /** Detalle y cómo seguir. */
  children?: ReactNode;
  /** Link o botón `sm` para resolverlo. */
  action?: ReactNode;
  className?: string;
};

const TONES: Record<NoticeTone, { box: string; iconColor: string; icon: ReactNode }> = {
  success: { box: "border-positive-line bg-positive-soft", iconColor: "text-positive", icon: <CheckIcon /> },
  error: { box: "border-negative-line bg-negative-soft", iconColor: "text-negative", icon: <CrossIcon /> },
  warning: { box: "border-warning-line bg-warning-soft", iconColor: "text-warning", icon: <AlertIcon /> },
  info: { box: "border-info-line bg-info-soft", iconColor: "text-info", icon: <InfoIcon /> },
};

/**
 * Mensaje en línea: resultado de una acción, error de un formulario, aviso.
 * `error` se anuncia como alerta; el resto como estado.
 */
export function Notice({ tone = "info", title, children, action, className }: NoticeProps) {
  const { box, iconColor, icon } = TONES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={clsx("flex items-start gap-2.5 rounded-lg border px-3.5 py-3", box, className)}>
      <span className={clsx("mt-0.5 shrink-0", iconColor)}>{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
        {title ? <p className="font-medium text-ink">{title}</p> : null}
        {children ? <div className="text-ink-2">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
