import { notFound, redirect } from "next/navigation";
import { JobDetail } from "@/components/views/job-detail";
import { getJob } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/trabajos/[id]">) {
  const { id } = await params;
  const job = await getJob(id);
  return { title: job?.title ?? "Campaña" };
}

export default async function JobPage({ params }: PageProps<"/trabajos/[id]">) {
  const { id } = await params;
  const [job, me] = await Promise.all([getJob(id), getSessionUser()]);
  if (!job) notFound();
  // Con la sesión iniciada, la campaña se ve dentro del panel.
  if (me && me.role !== "admin") redirect(`/app/campanas/${job.id}`);

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <JobDetail job={job} me={me} application={null} back={{ href: "/trabajos", label: "Campañas abiertas" }} />
    </div>
  );
}
