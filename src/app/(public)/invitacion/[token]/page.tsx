import { notFound } from "next/navigation";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { PayRuleSummary } from "@/components/domain/pay-rule-summary";
import { PlatformTag } from "@/components/domain/platform";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { acceptInvite } from "@/lib/actions/jobs";
import { getInvite } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "Invitación", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: PageProps<"/invitacion/[token]">) {
  const { token } = await params;
  const [invite, me] = await Promise.all([getInvite(token), getSessionUser()]);
  if (!invite) notFound();
  const next = encodeURIComponent(`/invitacion/${token}`);

  return (
    <div className="flex-1 bg-wash">
      <div className="mx-auto flex max-w-form flex-col gap-6 px-4 py-12 sm:py-16">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-ink-2">{invite.brandName} te invita a su equipo</p>
          <h1 className="type-page">{invite.title}</h1>
        </div>

        <Panel
          title="Cómo se paga"
          description={invite.platform ? <>Por las vistas en <PlatformTag platform={invite.platform} name={invite.platformName} className="align-bottom font-medium text-ink-2" /></> : undefined}
          className="shadow-xs"
        >
          <PayRuleSummary {...invite.payRule} />
        </Panel>

        {invite.usedBy ? (
          <Notice tone="info" title="Esta invitación ya fue usada">
            Cada link sirve para una persona. Pedile uno nuevo a {invite.brandName}.
          </Notice>
        ) : invite.expired ? (
          <Notice tone="warning" title="Esta invitación venció">
            Pedile un link nuevo a {invite.brandName}.
          </Notice>
        ) : !me ? (
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/registro?next=${next}`}>Crear mi perfil y aceptar</ButtonLink>
            <ButtonLink href={`/ingresar?next=${next}`} variant="secondary">
              Ya tengo cuenta
            </ButtonLink>
          </div>
        ) : me.role !== "worker" ? (
          <Notice tone="info" title="Esta invitación es para un perfil de trabajador">
            Estás usando una cuenta de contratador.
          </Notice>
        ) : (
          <ActionForm action={acceptInvite} className="flex flex-col gap-3">
            <input type="hidden" name="token" value={token} />
            <FormSubmit size="lg" block pendingLabel="Sumándote…">
              Aceptar y sumarme al equipo
            </FormSubmit>
          </ActionForm>
        )}
      </div>
    </div>
  );
}
