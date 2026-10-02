import { PublicFooter } from "@/components/shell/public-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { getSessionUser } from "@/lib/session";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const me = await getSessionUser();
  const user = me ? { name: me.name } : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Saltar al contenido
      </a>
      <PublicHeader user={user} />
      <main id="contenido" className="flex flex-1 flex-col">
        {children}
      </main>
      <PublicFooter user={user} />
    </div>
  );
}
