"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";

type EditableContextValue = { editing: boolean; open: () => void; close: (saved?: string) => void };

const EditableContext = createContext<EditableContextValue | null>(null);

/** Lo usa `ActionForm` para cerrar el bloque cuando la acción sale bien. */
export function useEditableSection() {
  return useContext(EditableContext);
}

export type EditableProps = {
  /** Lo que se ve sin editar. Lleva adentro su `EditTrigger`. */
  view: ReactNode;
  /** El formulario (`ActionForm`) con "Guardar" y `SectionCancel`. */
  children: ReactNode;
  className?: string;
};

/**
 * Datos que se editan en el lugar: muestra `view` hasta que se aprieta su
 * `EditTrigger`; entonces muestra el formulario. Al guardar bien o cancelar
 * vuelve a los datos, con la confirmación debajo.
 */
export function Editable({ view, children, className }: EditableProps) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<string>();
  const value: EditableContextValue = {
    editing,
    open: () => {
      setSaved(undefined);
      setEditing(true);
    },
    close: (message) => {
      setSaved(message);
      setEditing(false);
    },
  };
  return (
    <EditableContext.Provider value={value}>
      <div className={className}>
        {editing ? (
          children
        ) : (
          <>
            {view}
            {saved ? (
              <p role="status" className="mt-2 flex items-center gap-1.5 text-[0.8125rem] font-medium text-positive [&>svg]:size-3.5">
                <CheckIcon />
                {saved}
              </p>
            ) : null}
          </>
        )}
      </div>
    </EditableContext.Provider>
  );
}

/** El botón que abre el formulario de un `Editable`. */
export function EditTrigger({ children, size = "sm", variant = "secondary" }: { children: string } & Pick<ButtonProps, "size" | "variant">) {
  const editable = useEditableSection();
  if (!editable || editable.editing) return null;
  return (
    <Button size={size} variant={variant} onClick={editable.open}>
      {children}
    </Button>
  );
}

/** "Cancelar" de un formulario dentro de un `Editable`. */
export function SectionCancel() {
  const editable = useEditableSection();
  if (!editable) return null;
  return (
    <Button type="button" variant="ghost" onClick={() => editable.close()}>
      Cancelar
    </Button>
  );
}

export type SettingRowProps = {
  label: string;
  /** El dato. Sin dato se muestra "—". */
  value?: ReactNode;
  /** Una nota corta debajo del dato. */
  note?: ReactNode;
  /** Rótulo del botón para editar. Sin él, la fila es de solo lectura. */
  editLabel?: string;
  /** El formulario que reemplaza a la fila al editar. */
  children?: ReactNode;
};

/**
 * Una fila de ajustes: rótulo, dato y, a la derecha, el botón para cambiarlo.
 * Van dentro de un `SettingsGroup`. Al editar, la fila se abre en su formulario.
 */
export function SettingRow({ label, value, note, editLabel, children }: SettingRowProps) {
  const row = (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-5">
      <p className="text-sm font-medium text-ink sm:w-48 sm:shrink-0">{label}</p>
      <div className="min-w-0 flex-1 text-sm">
        <p className="break-words text-ink-2">{value || "—"}</p>
        {note ? <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-3">{note}</p> : null}
      </div>
      {editLabel ? (
        <div className="shrink-0">
          <EditTrigger>{editLabel}</EditTrigger>
        </div>
      ) : null}
    </div>
  );
  if (!editLabel || !children) return row;
  return (
    <Editable view={row}>
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <p className="text-sm font-medium text-ink">{label}</p>
        {children}
      </div>
    </Editable>
  );
}

/** Un grupo de `SettingRow` con su título, separadas por líneas finas. */
export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="type-title">{title}</h2>
      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">{children}</div>
    </section>
  );
}
