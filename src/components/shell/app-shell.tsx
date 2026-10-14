import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { NavLink } from "@/components/ui/nav-link";
import { Wordmark } from "./wordmark";

export type AppShellUser = {
  name: string;
  username: string;
  role: "hirer" | "worker" | "admin";
};

export type AppShellNavItem = {
  href: string;
  label: string;
  /** Ícono de `ui/icons`. */
  icon?: ReactNode;
  /** Sección de la barra lateral. Los ítems seguidos con la misma sección van juntos bajo ese rótulo. */
  group?: string;
  /** Otras rutas en las que el ítem también se marca activo. */
  alsoMatch?: string[];
  /** Cantidad pendiente al lado del rótulo. */
  badge?: number | string;
};

export type AppShellProps = {
  user: AppShellUser;
  nav: AppShellNavItem[];
  /**
   * El perfil no va en `nav`: en escritorio es el bloque de la cuenta, al pie
   * de la barra lateral; en celular, el avatar de la barra de arriba.
   */
  profileHref?: string;
  /** Server Action que cierra la sesión. Se envía con un <form>, sin JavaScript. */
  signOutAction: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
};

/**
 * Marco del panel autenticado. Escritorio: barra lateral clara, fija a la
 * izquierda. Celular: barra superior con la marca y la navegación fija abajo,
 * al alcance del pulgar.
 */
export function AppShell({ user, nav, profileHref, signOutAction, children }: AppShellProps) {
  // Ítems seguidos con la misma sección forman un grupo.
  const groups: { label?: string; items: AppShellNavItem[] }[] = [];
  for (const item of nav) {
    const last = groups.at(-1);
    if (last && last.label === item.group) last.items.push(item);
    else groups.push({ label: item.group, items: [item] });
  }
  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Saltar al contenido
      </a>

      {/* Escritorio: barra lateral */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-wash lg:flex">
        <div className="flex h-16 shrink-0 items-center px-5">
          <Wordmark href="/app" />
        </div>

        <nav aria-label="Secciones del panel" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
          {groups.map((group, index) => (
          <div key={group.label ?? index} className="flex flex-col gap-1">
          {group.label ? <p className="px-2.5 text-xs font-medium text-ink-3">{group.label}</p> : null}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                alsoMatch={item.alsoMatch}
                  className="group/nav flex h-9 items-center gap-2.5 rounded-md border border-transparent px-2.5 text-sm font-medium text-ink-2 transition-colors duration-100 hover:bg-wash-2 hover:text-ink aria-[current=page]:border-line aria-[current=page]:bg-surface aria-[current=page]:text-ink aria-[current=page]:shadow-xs"
                >
                  {item.icon ? <span className="flex shrink-0 text-ink-3 group-aria-[current=page]/nav:text-accent">{item.icon}</span> : null}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-soft px-1.5 text-xs leading-none font-medium text-accent tabular-nums">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
          </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-line px-3 py-3">
          {profileHref ? (
            <NavLink
              href={profileHref}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-transparent px-1.5 py-1 transition-colors duration-100 hover:bg-wash-2 aria-[current=page]:border-line aria-[current=page]:bg-surface aria-[current=page]:shadow-xs"
            >
              <Avatar name={user.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] leading-[1.125rem] font-medium text-ink">{user.name}</span>
                <span className="block truncate text-xs text-ink-3">@{user.username}</span>
              </span>
            </NavLink>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1.5 py-1">
              <Avatar name={user.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] leading-[1.125rem] font-medium text-ink">{user.name}</p>
                <p className="truncate text-xs text-ink-3">@{user.username}</p>
              </div>
            </div>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="cursor-pointer rounded-md px-2 py-1 text-[0.8125rem] font-medium text-ink-3 transition-colors duration-100 hover:bg-wash-2 hover:text-ink"
            >
              Salir
            </button>
          </form>
        </div>
      </aside>

      {/* Celular: barra superior */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 lg:hidden">
        <Wordmark href="/app" />
        <div className="flex items-center gap-1">
          {profileHref ? (
            <NavLink href={profileHref} aria-label="Perfil" className="flex size-9 items-center justify-center rounded-full aria-[current=page]:ring-2 aria-[current=page]:ring-accent">
              <Avatar name={user.name} size="sm" />
            </NavLink>
          ) : null}
          <form action={signOutAction}>
            <button type="submit" className="-mr-2 flex h-9 cursor-pointer items-center rounded-md px-2.5 text-[0.8125rem] font-medium text-ink-2 hover:bg-wash-2 hover:text-ink">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main id="contenido" className="min-w-0">
        <div className="mx-auto flex max-w-page flex-col gap-6 px-4 pt-6 pb-28 sm:gap-7 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10 lg:pb-16">{children}</div>
      </main>

      {/* Celular: navegación fija abajo */}
      <nav aria-label="Secciones del panel" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto flex max-w-md">
          {nav.map((item) => (
            <li key={item.href} className="min-w-0 flex-1">
              <NavLink
                href={item.href}
                alsoMatch={item.alsoMatch}
                className="group/nav flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[0.6875rem] leading-none font-medium text-ink-3 -outline-offset-2 aria-[current=page]:text-ink"
              >
                <span className="relative flex group-aria-[current=page]/nav:text-accent [&>svg]:size-[1.125rem]">
                  {item.icon}
                  {item.badge !== undefined ? (
                    <span className="absolute -top-1.5 left-3 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] leading-none font-semibold text-white tabular-nums ring-2 ring-surface">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate px-1">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
