import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { PublicUser } from "./public-header";
import { Wordmark } from "./wordmark";

export type PublicFooterProps = {
  user: PublicUser;
  loginHref?: string;
  panelHref?: string;
};

const linkClass = "rounded-sm text-ink-2 transition-colors duration-100 hover:text-ink";

/** Pie de las páginas públicas: una línea fina, la marca y tres links. */
export function PublicFooter({ user, loginHref = "/ingresar", panelHref = "/app" }: PublicFooterProps) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-7 text-[0.8125rem] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Wordmark size="sm" />
          <p className="text-ink-3">{BRAND.tagline}</p>
        </div>
        <nav aria-label="Pie de página">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href="/trabajos" className={linkClass}>
                Trabajos
              </Link>
            </li>
            <li>
              <Link href="/talento" className={linkClass}>
                Talento
              </Link>
            </li>
            <li>
              <Link href={user ? panelHref : loginHref} className={linkClass}>
                {user ? "Ir al panel" : "Ingresar"}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
