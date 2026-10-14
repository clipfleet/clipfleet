"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";
import { Input, type InputProps } from "./input";

export type PasswordInputProps = Omit<InputProps, "type" | "trailing" | "ref">;

/** Input de contraseña con un botón de ojo para mostrarla u ocultarla. */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Dónde estaba el cursor al apretar el ojo, si el campo tenía el foco.
  const caret = useRef<{ start: number; end: number } | null>(null);

  function toggle() {
    const input = inputRef.current;
    caret.current =
      input && document.activeElement === input ? { start: input.selectionStart ?? 0, end: input.selectionEnd ?? 0 } : null;
    setVisible((v) => !v);
  }

  // Cambiar el `type` mueve el cursor: se lo devuelve a su lugar.
  useLayoutEffect(() => {
    const input = inputRef.current;
    const saved = caret.current;
    if (!input || !saved) return;
    caret.current = null;
    const restore = () => input.setSelectionRange(saved.start, saved.end);
    input.focus();
    restore();
    // Con un clic real, el navegador lo vuelve a mandar al principio después de este efecto.
    const frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  return (
    <Input
      {...props}
      ref={inputRef}
      type={visible ? "text" : "password"}
      // Sin corrector ni mayúscula automática cuando queda a la vista.
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <button
          type="button"
          // Con el mouse, el foco se queda en el campo y se sigue escribiendo. Con el teclado
          // el botón se alcanza con Tab como cualquier otro.
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggle}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="-mr-1.5 flex size-7 cursor-pointer items-center justify-center rounded-sm text-ink-3 hover:text-ink"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
