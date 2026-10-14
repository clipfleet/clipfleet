"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { Panel } from "@/components/ui/panel";

const SectionContext = createContext<{ close: (saved?: string) => void } | null>(null);

/** Lo usa `ActionForm` para cerrar la sección cuando la acción sale bien. */
export function useEditableSection() {
  return useContext(SectionContext);
}

export type EditableSectionProps = {
  title: string;
  /** Lo que se ve sin editar: casi siempre un `DetailList`. */
  view: ReactNode;
  /** El formulario (`ActionForm`). Lleva sus propios botones; "Cancelar" lo agrega la sección. */
  children: ReactNode;
  /** Rótulo del botón que abre el formulario. "Completar" cuando todavía no hay datos. */
  editLabel?: string;
  /** Una nota corta debajo de los datos (no en el encabezado, para que "Editar" no se corra de lugar). */
  description?: ReactNode;
  className?: string;
};

/**
 * Un bloque del perfil: se lee como datos y se edita en el lugar. Al apretar
 * "Editar" el bloque se convierte en su formulario; al guardar bien o cancelar
 * vuelve a mostrar los datos. El resto de la página no cambia.
 */
export function EditableSection({ title, view, children, editLabel = "Editar", description, className }: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<string>();
  return (
    <Panel
      title={title}
      className={className}
      actions={
        editing ? null : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSaved(undefined);
              setEditing(true);
            }}
          >
            {editLabel}
          </Button>
        )
      }
    >
      {editing ? (
        <SectionContext.Provider
          value={{
            close: (message) => {
              setSaved(message);
              setEditing(false);
            },
          }}
        >
          {children}
        </SectionContext.Provider>
      ) : (
        <>
          {view}
          {description ? <p className="mt-4 text-[0.8125rem] leading-snug text-ink-3">{description}</p> : null}
          {saved ? (
            <p role="status" className="mt-4 flex items-center gap-1.5 text-[0.8125rem] font-medium text-positive [&>svg]:size-3.5">
              <CheckIcon />
              {saved}
            </p>
          ) : null}
        </>
      )}
    </Panel>
  );
}

/** "Cancelar" de un formulario dentro de `EditableSection`. */
export function SectionCancel() {
  const section = useEditableSection();
  if (!section) return null;
  return (
    <Button type="button" variant="ghost" onClick={() => section.close()}>
      Cancelar
    </Button>
  );
}

/** Pares rótulo / valor de solo lectura. Sin dato se muestra "—". */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-ink-3">{item.label}</dt>
          <dd className="min-w-0 break-words text-ink max-sm:-mt-2">{item.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
