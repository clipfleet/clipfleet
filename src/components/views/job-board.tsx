import type { ReactNode } from "react";
import { JobList, JobRow } from "@/components/domain/job-row";
import { payRuleText } from "@/components/domain/pay-rule-summary";
import { EmptyState } from "@/components/ui/empty-state";
import type { listOpenJobs } from "@/lib/queries";

export type JobBoardProps = {
  jobs: Awaited<ReturnType<typeof listOpenJobs>>;
  /** Adónde lleva cada fila: la página pública o la del panel. */
  hrefFor: (jobId: string) => string;
  emptyAction?: ReactNode;
};

/** Las campañas abiertas. La usan la página pública y el panel. */
export function JobBoard({ jobs, hrefFor, emptyAction }: JobBoardProps) {
  if (jobs.length === 0) return <EmptyState title="Todavía no hay campañas abiertas" action={emptyAction} />;
  return (
    <JobList>
      {jobs.map((job) => (
        <JobRow key={job.id} href={hrefFor(job.id)} title={job.title} brandName={job.brandName} platform={job.platform} platformName={job.platformName} payRuleSummary={payRuleText(job.payRule)} />
      ))}
    </JobList>
  );
}
