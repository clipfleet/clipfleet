"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ComponentProps } from "react";

export type NavLinkProps = ComponentProps<typeof Link> & {
  href: string;
  /** Activo solo si la ruta es exactamente `href` (sin contar subrutas). */
  exact?: boolean;
  /** Fuerza el estado activo. Usalo cuando la pestaña depende de un searchParam. */
  active?: boolean;
};

/**
 * Link que se marca como activo (`aria-current="page"`) cuando la ruta actual
 * es `href` o una subruta. Único componente cliente de la navegación: el
 * estilo del estado activo se resuelve con `aria-[current=page]:` en className.
 */
export function NavLink({ href, exact = false, active, ...rest }: NavLinkProps) {
  const pathname = usePathname();
  const path = href.split(/[?#]/)[0];
  const matches = pathname === path || (!exact && path !== "/" && pathname.startsWith(`${path}/`));
  const isActive = active ?? matches;
  const ref = useRef<HTMLAnchorElement>(null);

  // En las tiras de navegación que se deslizan de costado (celular), trae el ítem activo a la vista.
  useEffect(() => {
    const link = ref.current;
    const strip = link?.closest("nav");
    if (!isActive || !link || !strip || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: link.offsetLeft - (strip.clientWidth - link.offsetWidth) / 2 });
  }, [isActive]);

  return <Link ref={ref} href={href} aria-current={isActive ? "page" : undefined} {...rest} />;
}
