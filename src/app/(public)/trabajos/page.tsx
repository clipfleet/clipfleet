import { JobList, JobRow } from "@/components/domain/job-row";
import { payRuleText } from "@/components/domain/pay-rule-summary";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listOpenJobs } from "@/lib/queries";

export const metadata = { title: "Trabajos" };
export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await listOpenJobs();

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <PageHeader title="Trabajos" />

      {jobs.length === 0 ? (
        <EmptyState title="Todavía no hay búsquedas abiertas" action={<ButtonLink href="/registro">Crear mi perfil</ButtonLink>} />
      ) : (
        <JobList>
          {jobs.map((job) => (
            <JobRow key={job.id} href={`/trabajos/${job.id}`} title={job.title} brandName={job.brandName} platform={job.platform} platformName={job.platformName} payRuleSummary={payRuleText(job.payRule)} />
          ))}
        </JobList>
      )}
    </div>
  );
}
