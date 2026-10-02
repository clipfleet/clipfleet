import { redirect } from "next/navigation";
import { homeFor, requireUser } from "@/lib/session";

export default async function AppIndex() {
  const me = await requireUser();
  redirect(homeFor(me.role));
}
