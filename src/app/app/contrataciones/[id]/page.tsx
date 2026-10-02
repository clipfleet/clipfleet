import { notFound } from "next/navigation";
import { ContractView } from "@/components/contract/contract-view";
import { getContractDetail } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Trabajo" };

export default async function MyContractPage({ params }: PageProps<"/app/contrataciones/[id]">) {
  const me = await requireUser("worker");
  const { id } = await params;
  const detail = await getContractDetail(id, me.id);
  if (!detail) notFound();
  return <ContractView detail={detail} viewer="worker" userId={me.id} />;
}
