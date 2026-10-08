import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { CopyField } from "@/components/forms/copy-field";
import { PayRuleFields } from "@/components/forms/pay-rule-fields";
import { PlatformField } from "@/components/forms/platform-field";
import { payRuleText } from "@/components/domain/pay-rule-summary";
import { PlatformTag } from "@/components/domain/platform";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { formatShortDate } from "@/components/ui/format";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createInvites } from "@/lib/actions/jobs";
import { baseUrl } from "@/lib/base-url";
import { listInvites } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Invitar por link" };

export default async function InvitePage() {
  const me = await requireUser("hirer");
  const [invites, origin] = await Promise.all([listInvites(me.id), baseUrl()]);

  return (
    <>
      <PageHeader back={{ href: "/app/equipo", label: "Equipo" }} title="Invitar por link" />

      <Panel className="max-w-2xl">
        <ActionForm action={createInvites} className="flex flex-col gap-5">
          <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
            <Field label="Nombre del trabajo">
              <Input name="title" required placeholder="Ej. Clips del canal" />
            </Field>
            <Field label="Links" hint="Uno por persona.">
              <Input name="quantity" type="number" min="1" max="30" step="1" defaultValue="1" inputMode="numeric" />
            </Field>
          </div>
          <PlatformField />
          <PayRuleFields />
          <div>
            <FormSubmit pendingLabel="Generando…">Generar links</FormSubmit>
          </div>
        </ActionForm>
      </Panel>

      {invites.length > 0 ? (
        <Panel title="Links generados" padded={false}>
          <Table caption="Links de invitación" layout="stack" minWidth={760}>
            <THead>
              <TR>
                <TH>Trabajo</TH>
                <TH>Pago</TH>
                <TH>Estado</TH>
                <TH width="22rem">Link</TH>
              </TR>
            </THead>
            <TBody>
              {invites.map(({ invite, usedByName, expired }) => {
                return (
                  <TR key={invite.id} tone={invite.usedBy || expired ? "muted" : "default"}>
                    <TH scope="row">{invite.title}</TH>
                    <TD label="Pago" className="tabular-nums">
                      {invite.platform ? <><PlatformTag platform={invite.platform} /> · </> : null}
                      {payRuleText(invite.payRule)}
                    </TD>
                    <TD label="Estado">
                      {invite.usedBy ? (
                        <Badge tone="positive">Usado por {usedByName}</Badge>
                      ) : expired ? (
                        <Badge>Vencido</Badge>
                      ) : (
                        <Badge tone="info">Vence el {formatShortDate(invite.expiresAt)}</Badge>
                      )}
                    </TD>
                    <TD label="Link" actions>
                      {invite.usedBy || expired ? null : <CopyField value={`${origin}/invitacion/${invite.token}`} label={`Link de invitación para ${invite.title}`} />}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Panel>
      ) : null}
    </>
  );
}
