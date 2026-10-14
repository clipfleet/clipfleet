import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TalentTable } from "@/components/views/talent-table";
import { listWorkers } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Talento" };

export default async function PanelTalentPage() {
  await requireUser();
  const workers = await listWorkers();

  return (
    <>
      <PageHeader title="Talento" />
      {workers.length === 0 ? <EmptyState title="Todavía no hay perfiles" /> : <TalentTable workers={workers} hrefFor={(username) => `/app/talento/${username}`} />}
    </>
  );
}
