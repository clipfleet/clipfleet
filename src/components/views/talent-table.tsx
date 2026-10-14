import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Num } from "@/components/ui/num";
import { Panel } from "@/components/ui/panel";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { listWorkers } from "@/lib/queries";

export type TalentTableProps = {
  workers: Awaited<ReturnType<typeof listWorkers>>;
  /** Adónde lleva cada fila: el perfil público o el del panel. */
  hrefFor: (username: string) => string;
};

/** Directorio de gestores con sus resultados. Lo usan la página pública y el panel. */
export function TalentTable({ workers, hrefFor }: TalentTableProps) {
  return (
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
                    <Link href={hrefFor(worker.username)} className="rounded-sm after:absolute after:inset-0">
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
  );
}
