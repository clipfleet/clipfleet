"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Botón que copia un texto (un link) sin mostrarlo. Para mostrar el link y copiarlo, `CopyField`. */
export function CopyButton({ value, children, size = "sm", variant = "secondary" }: { value: string; children: string } & Pick<ButtonProps, "size" | "variant">) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size={size}
      variant={variant}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copiado" : children}
    </Button>
  );
}
