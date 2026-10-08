import { CopyField } from "@/components/forms/copy-field";
import { Notice } from "@/components/ui/notice";
import { ACCOUNT_KIND_LABEL } from "@/lib/payment-details";
import type { PayeeView } from "@/lib/payment-details/service";

/**
 * A dónde transferir para pagar una liquidación: la cuenta con botón de copiar y el titular,
 * para compararlo con el que muestra el banco antes de confirmar.
 */
export function PayeeBlock({ payee, name }: { payee: PayeeView | null; name: string }) {
  if (!payee) {
    return <p className="text-[0.8125rem] text-ink-2">{name} todavía no cargó sus datos de cobro. Pedíselos por mensaje.</p>;
  }
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-[0.8125rem] text-ink-2">
        Transferí a este {payee.accountKind === "alias" ? "alias" : ACCOUNT_KIND_LABEL[payee.accountKind]}, a nombre de <span className="font-medium text-ink">{payee.holderName}</span>
      </p>
      <div className="max-w-md">
        <CopyField value={payee.account} label={`${ACCOUNT_KIND_LABEL[payee.accountKind]} de ${name}`} />
      </div>
      {payee.changedSinceLastPayment ? (
        <Notice tone="warning" title="Cambió sus datos de cobro desde tu último pago">
          Confirmá con {name} por otro medio antes de transferir.
        </Notice>
      ) : null}
    </div>
  );
}
