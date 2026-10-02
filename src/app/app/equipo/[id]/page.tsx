import { notFound } from "next/navigation";
import { ContractView } from "@/components/contract/contract-view";
import { getContractDetail } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Contratación" };

export default async function TeamMemberPage({ params }: PageProps<"/app/equipo/[id]">) {
  const me = await requireUser("hirer");
  const { id } = await params;
  const detail = await getContractDetail(id, me.id);
  if (!detail) notFound();
  return <ContractView detail={detail} viewer="hirer" userId={me.id} />;
}
