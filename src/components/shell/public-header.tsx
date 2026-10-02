import { ButtonLink } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { Wordmark } from "./wordmark";

export type PublicUser = { name: string } | null;

export type PublicHeaderProps = {
  /** `null` muestra "Ingresar / Registrarme"; con usuario, "Ir al panel". */
  user: PublicUser;
  loginHref?: string;
  registerHref?: string;
  panelHref?: string;
};

const NAV = [
  { href: "/trabajos", label: "Trabajos" },
  { href: "/talento", label: "Talento" },
] as const;

/** Encabezado de las páginas públicas. Sin menú hamburguesa: son dos links y entran siempre. */
export function PublicHeader({ user, loginHref = "/ingresar", registerHref = "/registro", panelHref = "/app" }: PublicHeaderProps) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-page items-center gap-3 px-4 sm:h-16 sm:gap-8 sm:px-6 lg:px-8">
        <Wordmark />

        <nav aria-label="Principal" className="min-w-0 flex-1">
          <ul className="flex items-center gap-0.5 sm:gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  className="flex h-8 items-center rounded-md px-2 text-sm font-medium text-ink-2 transition-colors duration-100 hover:text-ink aria-[current=page]:text-ink sm:px-2.5"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {user ? (
          <ButtonLink href={panelHref} variant="secondary" size="sm">
            Ir al panel
          </ButtonLink>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            <ButtonLink href={loginHref} variant="ghost" size="sm" className="px-2 sm:px-3">
              Ingresar
            </ButtonLink>
            {/* En pantallas muy angostas queda solo "Ingresar": el registro está en el cuerpo de cada página. */}
            <span className="hidden min-[27rem]:inline-flex">
              <ButtonLink href={registerHref} size="sm">
                Registrarme
              </ButtonLink>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
