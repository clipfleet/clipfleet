"use client";

import clsx from "clsx";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Tab = { label: string; panel: ReactNode };

/**
 * Pestañas de la landing para elegir qué captura de producto se ve. Las capturas
 * se arman en el servidor y llegan como `panel`; acá solo se elige cuál mostrar.
 */
export function PreviewTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Flechas para moverse entre pestañas, como pide el patrón de ARIA.
  function onKeyDown(event: KeyboardEvent) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (selected + step + tabs.length) % tabs.length;
    setSelected(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="inline-flex self-start rounded-md border border-line bg-wash p-0.5">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={index === selected}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => setSelected(index)}
            className={clsx(
              "h-8 cursor-pointer rounded-[5px] border px-3 text-[0.8125rem] font-medium transition-colors duration-100",
              index === selected ? "border-line bg-surface text-ink shadow-xs" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div key={tab.label} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={index !== selected}>
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
