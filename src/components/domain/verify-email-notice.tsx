"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { sendVerificationEmail } from "@/lib/actions/auth";
import type { ActionResult } from "@/lib/actions/result";

/** Aviso del panel mientras el email no está verificado. No bloquea nada: solo ofrece el link. */
export function VerifyEmailNotice({ email }: { email: string }) {
  const [result, setResult] = useState<ActionResult>();
  const [pending, startTransition] = useTransition();

  if (result && "ok" in result) return <Notice tone="success" title={result.ok} />;

  return (
    <Notice
      tone="warning"
      title="Tu email no está verificado."
      action={
        <Button
          size="sm"
          variant="secondary"
          pending={pending}
          pendingLabel="Mandando…"
          onClick={() => startTransition(async () => setResult((await sendVerificationEmail()) ?? undefined))}
        >
          Verificar email
        </Button>
      }
    >
      {result && "error" in result ? result.error : `Confirmá que ${email} es tuyo.`}
    </Notice>
  );
}
