import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { PlatformTag } from "@/components/domain/platform";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { JobPlatform } from "@/lib/domain/categories";

/** Contenedor de <JobRow>: una lista con divisores finos dentro de un solo recuadro. */
export function JobList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={clsx("divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface", className)}>{children}</ul>;
}

export type JobRowProps = {
  href: string;
  title: string;
  /** Canal o marca que contrata. */
  brandName: string;
  /** Dónde se publican los videos; la paga es por las vistas ahí. */
  platform: JobPlatform | null;
  /** Nombre de la plataforma cuando es `otra`. */
  platformName?: string | null;
  /** Regla de pago en una línea. Generala con `payRuleText(rule)`. */
  payRuleSummary: string;
};

/** Una búsqueda en la bolsa: qué es, quién contrata y cuánto paga. Nada más. Toda la fila es el link. */
export function JobRow({ href, title, brandName, platform, platformName, payRuleSummary }: JobRowProps) {
  return (
    <li className="group relative flex items-center gap-4 px-4 py-4 transition-colors duration-100 hover:bg-wash has-[a:focus-visible]:bg-wash sm:px-5">
      <div className="grid min-w-0 flex-1 gap-x-10 gap-y-1.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] leading-snug font-medium text-ink">
            <Link href={href} className="rounded-sm after:absolute after:inset-0">
              {title}
            </Link>
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[0.8125rem] text-ink-3">
            {brandName}
            {platform ? (
              <>
                <span aria-hidden="true">·</span>
                <PlatformTag platform={platform} name={platformName} />
              </>
            ) : null}
          </p>
        </div>
        <p className="text-sm text-ink-2 tabular-nums md:max-w-[26rem] md:text-right">{payRuleSummary}</p>
      </div>
      <ChevronRightIcon className="shrink-0 text-ink-4 transition-colors duration-100 group-hover:text-ink-2" />
    </li>
  );
}
