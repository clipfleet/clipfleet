import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { WorkerProfile } from "@/components/views/worker-profile";
import { getWorkerActivity, getWorkerByUsername } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/t/[username]">) {
  const { username } = await params;
  const worker = await getWorkerByUsername(username);
  return { title: worker ? `${worker.user.name} (@${worker.user.username})` : "Perfil" };
}

export default async function WorkerProfilePage({ params }: PageProps<"/t/[username]">) {
  const { username } = await params;
  const worker = await getWorkerByUsername(username);
  if (!worker) notFound();
  const me = await getSessionUser();
  // Con la sesión iniciada, el perfil se ve dentro del panel.
  if (me && me.role !== "admin") redirect(`/app/talento/${worker.user.username}`);
  const activity = await getWorkerActivity(worker.user.id);
  const firstName = worker.user.name.split(" ")[0];

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <WorkerProfile worker={worker} activity={activity} action={me ? null : <ButtonLink href="/registro?rol=contratador">Contratar a {firstName}</ButtonLink>} />
    </div>
  );
}
