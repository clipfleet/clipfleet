import { notFound } from "next/navigation";
import { CopyButton } from "@/components/forms/copy-button";
import { Notice } from "@/components/ui/notice";
import { JobDetail } from "@/components/views/job-detail";
import { baseUrl } from "@/lib/base-url";
import { getJob, getMyApplication } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/app/campanas/[id]">) {
  const { id } = await params;
  const job = await getJob(id);
  return { title: job?.title ?? "Campaña" };
}

export default async function PanelJobPage({ params }: PageProps<"/app/campanas/[id]">) {
  const me = await requireUser();
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();
  const isOwner = job.hirerId === me.id;
  const [application, origin] = await Promise.all([me.role === "worker" ? getMyApplication(job.id, me.id) : null, baseUrl()]);

  return (
    <JobDetail
      job={job}
      me={me}
      application={application}
      back={isOwner ? { href: `/app/busquedas/${job.id}`, label: "Tu campaña" } : { href: "/app/campanas", label: "Campañas" }}
      notice={
        isOwner ? (
          <Notice tone="info" title="Vista previa: así ven tu campaña quienes suben videos" action={<CopyButton value={`${origin}/trabajos/${job.id}`}>Copiar link</CopyButton>} />
        ) : null
      }
    />
  );
}
