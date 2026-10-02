"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Texto de solo lectura con botón para copiarlo (links de invitación, link del perfil). */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Input
        readOnly
        value={value}
        aria-label={label}
        onFocus={(event) => event.currentTarget.select()}
        size="sm"
        className="min-w-0 flex-1 font-mono text-[0.8125rem] text-ink-2 sm:text-xs"
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copiado" : "Copiar"}
      </Button>
    </span>
  );
}
