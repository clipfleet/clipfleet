import type { Metadata, Viewport } from "next";
import { Host_Grotesk } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

// Una sola familia para todo: texto, títulos y cifras (con numerales tabulares).
// Ver docs/design-system.md → Tipografía.
const appFont = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={appFont.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
