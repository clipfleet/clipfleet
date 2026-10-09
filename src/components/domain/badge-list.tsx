import clsx from "clsx";
import type { ReactNode } from "react";
import { BoltIcon, CalendarCheckIcon, EyeIcon, LayersIcon } from "@/components/ui/icons";
import type { BadgeFamily, EarnedBadge } from "@/lib/stats/badges";

export const BADGE_ICON: Record<BadgeFamily, ReactNode> = {
  reach: <EyeIcon />,
  volume: <LayersIcon />,
  viral: <BoltIcon />,
  streak: <CalendarCheckIcon />,
};

/**
 * Insignias ganadas: una por familia, la del nivel más alto. Sobrias a propósito: ícono de
 * línea, el logro en palabras y tres marcas que dicen el nivel. No son medallas.
 */
export function BadgeList({ badges, className }: { badges: EarnedBadge[]; className?: string }) {
  if (badges.length === 0) return null;
  return (
    <ul aria-label="Insignias" className={clsx("flex flex-wrap gap-2", className)}>
      {badges.map((badge) => (
        <li
          key={badge.family}
          title={`${badge.familyName}: nivel ${badge.level} de 3`}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-3 pl-2.5 text-[0.8125rem] font-medium text-ink"
        >
          <span className="text-accent">{BADGE_ICON[badge.family]}</span>
          {badge.label}
          <span aria-hidden="true" className="flex gap-0.5">
            {[1, 2, 3].map((level) => (
              <span key={level} className={clsx("h-2.5 w-[3px] rounded-full", level <= badge.level ? "bg-accent" : "bg-line-strong")} />
            ))}
          </span>
          <span className="sr-only">
            , nivel {badge.level} de 3 en {badge.familyName.toLowerCase()}
          </span>
        </li>
      ))}
    </ul>
  );
}
