import { redirect } from "next/navigation";
import { AppShell, type AppShellNavItem } from "@/components/shell/app-shell";
import { BriefcaseIcon, LayersIcon, ReceiptIcon, SearchIcon, SendIcon, TeamIcon } from "@/components/ui/icons";
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
      { href: "/app/equipo", label: "Contratados", icon: <TeamIcon />, group: "Gestión", badge: badge(counts.toReview) },
      { href: "/app/liquidaciones", label: "Liquidaciones", icon: <ReceiptIcon />, group: "Gestión", badge: badge(counts.pendingPayouts) },
      // Las campañas son gestión (postulaciones por responder) y también la forma de contratar: van primero en "Contratar", con su contador.
      { href: "/app/busquedas", label: "Campañas", icon: <LayersIcon />, group: "Contratar", alsoMatch: ["/app/campanas"], badge: badge(counts.applications) },
      { href: "/app/talento", label: "Talento", icon: <SearchIcon />, group: "Contratar" },
    ];
  } else {
    const counts = await workerNavCounts(me.id);
    nav = [
      { href: "/app/contrataciones", label: "Mis trabajos", icon: <BriefcaseIcon />, group: "Trabajo", badge: badge(counts.requested) },
      { href: "/app/cobros", label: "Cobros", icon: <ReceiptIcon />, group: "Trabajo", badge: badge(counts.paymentsToConfirm) },
      { href: "/app/campanas", label: "Campañas", icon: <SearchIcon />, group: "Buscar trabajo" },
      { href: "/app/postulaciones", label: "Postulaciones", icon: <SendIcon />, group: "Buscar trabajo" },
    ];
  }

  return (
    <AppShell user={me} nav={nav} profileHref="/app/perfil" signOutAction={signOut}>
      {children}
    </AppShell>
  );
}
