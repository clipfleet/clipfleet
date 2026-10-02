import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Num } from "@/components/ui/num";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { listWorkers } from "@/lib/queries";

export const metadata = { title: "Talento" };
export const dynamic = "force-dynamic";

export default async function TalentPage() {
  const workers = await listWorkers();

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <PageHeader title="Talento" />

      {workers.length === 0 ? (
        <EmptyState title="Todavía no hay perfiles" action={<ButtonLink href="/registro?rol=contratador">Publicar una búsqueda</ButtonLink>} />
      ) : (
        <Panel padded={false}>
          <Table caption="Gestores de multicuentas y sus resultados" minWidth={0}>
            <THead>
              <TR>
                <TH>Persona</TH>
                <TH numeric className="w-20 sm:w-36">
                  Videos
                </TH>
                <TH numeric className="w-24 sm:w-36">
                  Vistas
                </TH>
              </TR>
            </THead>
            <TBody>
              {workers.map((worker) => (
                <TR key={worker.id}>
                  <TH scope="row" className="relative">
                    <span className="flex items-center gap-3">
                      <Avatar name={worker.name} />
                      <span className="min-w-0">
                        <Link href={`/t/${worker.username}`} className="rounded-sm after:absolute after:inset-0">
                          {worker.name}
                        </Link>
                        <span className="block text-[0.8125rem] font-normal text-ink-3">@{worker.username}</span>
                      </span>
                    </span>
                  </TH>
                  <TD numeric>
                    <Num value={worker.stats.approvedDeliverables > 0 ? worker.stats.approvedDeliverables : null} compact={false} />
                  </TD>
                  <TD numeric>
                    <Num value={worker.stats.totalViews > 0 ? worker.stats.totalViews : null} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
