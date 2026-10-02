import { redirect } from "next/navigation";
import { AppShell, type AppShellNavItem } from "@/components/shell/app-shell";
import { BriefcaseIcon, ReceiptIcon, SearchIcon, SendIcon, TeamIcon, UserIcon } from "@/components/ui/icons";
import { signOut } from "@/lib/actions/auth";
import { hirerNavCounts, workerNavCounts } from "@/lib/queries";
import { requireUser } from "@/lib/session";

const badge = (count: number) => (count > 0 ? count : undefined);

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const me = await requireUser();
  if (me.role === "admin") redirect("/");

  let nav: AppShellNavItem[];
  if (me.role === "hirer") {
    const counts = await hirerNavCounts(me.id);
    nav = [
      { href: "/app/equipo", label: "Equipo", icon: <TeamIcon />, badge: badge(counts.toReview) },
      { href: "/app/busquedas", label: "Búsquedas", icon: <SearchIcon />, badge: badge(counts.applications) },
      { href: "/app/liquidaciones", label: "Liquidaciones", icon: <ReceiptIcon />, badge: badge(counts.pendingPayouts) },
      { href: "/app/perfil", label: "Perfil", icon: <UserIcon /> },
    ];
  } else {
    const counts = await workerNavCounts(me.id);
    nav = [
      { href: "/app/contrataciones", label: "Mis trabajos", icon: <BriefcaseIcon />, badge: badge(counts.requested + counts.paymentsToConfirm) },
      { href: "/app/postulaciones", label: "Postulaciones", icon: <SendIcon /> },
      { href: "/app/perfil", label: "Perfil", icon: <UserIcon /> },
    ];
  }

  return (
    <AppShell user={me} nav={nav} signOutAction={signOut}>
      {children}
    </AppShell>
  );
}
