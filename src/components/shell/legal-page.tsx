import type { ReactNode } from "react";

/**
 * Marco de las páginas legales (términos, privacidad): título, fecha de la
 * última actualización y el texto en una columna angosta. El contenido usa
 * <h2>, <p> y <ul> sin clases; el estilo lo pone este marco.
 */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-prose flex-col gap-8 px-4 py-12 sm:py-16">
      <div className="flex flex-col gap-1.5">
        <h1 className="type-page">{title}</h1>
        <p className="text-[0.8125rem] text-ink-3">Última actualización: {updated}</p>
      </div>
      <div className="flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-ink-2 [&_a]:font-medium [&_a]:text-accent [&_a:hover]:text-accent-hover [&_h2]:mt-4 [&_h2]:type-title [&_h2]:text-ink [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
