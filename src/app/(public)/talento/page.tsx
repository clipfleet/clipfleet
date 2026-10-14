import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TalentTable } from "@/components/views/talent-table";
import { listWorkers } from "@/lib/queries";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "Talento" };
export const dynamic = "force-dynamic";

export default async function TalentPage() {
  const me = await getSessionUser();
  // Con la sesión iniciada, el directorio se ve dentro del panel.
  if (me && me.role !== "admin") redirect("/app/talento");
  const workers = await listWorkers();

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <PageHeader title="Talento" />
      {workers.length === 0 ? (
        <EmptyState title="Todavía no hay perfiles" action={<ButtonLink href="/registro?rol=contratador">Publicar una campaña</ButtonLink>} />
      ) : (
        <TalentTable workers={workers} hrefFor={(username) => `/t/${username}`} />
      )}
    </div>
  );
}
