import { PageHeader } from "@/components/ui/page-header";
import { JobBoard } from "@/components/views/job-board";
import { listOpenJobs } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Campañas" };

export default async function PanelJobsPage() {
  await requireUser();
  const jobs = await listOpenJobs();

  return (
    <>
      <PageHeader title="Campañas" />
      <JobBoard jobs={jobs} hrefFor={(id) => `/app/campanas/${id}`} />
    </>
  );
}
