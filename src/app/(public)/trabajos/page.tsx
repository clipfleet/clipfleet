import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { JobBoard } from "@/components/views/job-board";
import { listOpenJobs } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "Campañas abiertas" };
export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const me = await getSessionUser();
  // Con la sesión iniciada, las campañas se ven dentro del panel.
  if (me && me.role !== "admin") redirect("/app/campanas");
  const jobs = await listOpenJobs();

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <PageHeader title="Campañas abiertas" />
      <JobBoard jobs={jobs} hrefFor={(id) => `/trabajos/${id}`} emptyAction={<ButtonLink href="/registro">Crear mi perfil</ButtonLink>} />
    </div>
  );
}
