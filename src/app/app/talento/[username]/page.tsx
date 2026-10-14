import { notFound } from "next/navigation";
import { ActionForm, FormSubmit } from "@/components/forms/action-form";
import { CopyField } from "@/components/forms/copy-field";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { WorkerProfile } from "@/components/views/worker-profile";
import { decideApplication } from "@/lib/actions/jobs";
import { baseUrl } from "@/lib/base-url";
import { getWorkerActivity, getWorkerByUsername, listPendingApplicationsFrom } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/app/talento/[username]">) {
  const { username } = await params;
  const worker = await getWorkerByUsername(username);
  return { title: worker ? `${worker.user.name} (@${worker.user.username})` : "Perfil" };
}

export default async function PanelWorkerProfilePage({ params, searchParams }: PageProps<"/app/talento/[username]">) {
  const me = await requireUser();
  const { username } = await params;
  const worker = await getWorkerByUsername(username);
  if (!worker) notFound();
  const { campana } = await searchParams;
  const fromJob = typeof campana === "string" && /^[\w-]{1,64}$/.test(campana) ? campana : null;
  const isOwner = me.id === worker.user.id;
  const [activity, origin, pending] = await Promise.all([
    getWorkerActivity(worker.user.id),
    baseUrl(),
    me.role === "hirer" ? listPendingApplicationsFrom(me.id, worker.user.id) : [],
  ]);
  const firstName = worker.user.name.split(" ")[0];

  const back = isOwner
    ? { href: "/app/perfil", label: "Perfil" }
    : fromJob && me.role === "hirer"
      ? { href: `/app/busquedas/${fromJob}`, label: "Volver a la campaña" }
      : { href: "/app/talento", label: "Talento" };

  return (
    <WorkerProfile
      worker={worker}
      activity={activity}
      back={back}
      action={
        me.role === "hirer" && pending.length === 0 ? (
          <ButtonLink href="/app/equipo/invitar" variant="secondary">
            Invitar a {firstName} a mi equipo
          </ButtonLink>
        ) : null
      }
      notice={
        isOwner ? (
          <Notice tone="info" title="Vista previa: así ven tu perfil">
            <span className="mt-2 block max-w-md">
              <CopyField value={`${origin}/t/${worker.user.username}`} label="Link público de tu perfil" />
            </span>
          </Notice>
        ) : pending.length > 0 ? (
          <div className="flex flex-col gap-3">
            {pending.map((application) => (
              <Notice
                key={application.id}
                tone="warning"
                title={`Se postuló a ${application.jobTitle}`}
                action={
                  <ActionForm action={decideApplication} feedback="inline" className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <FormSubmit size="sm" name="decision" value="accepted">
                      Contratar
                    </FormSubmit>
                    <FormSubmit size="sm" variant="ghost" name="decision" value="rejected">
                      Descartar
                    </FormSubmit>
                  </ActionForm>
                }
              >
                {application.message ? `“${application.message}”` : null}
              </Notice>
            ))}
          </div>
        ) : null
      }
    />
  );
}
