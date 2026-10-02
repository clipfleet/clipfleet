import clsx from "clsx";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export type WordmarkProps = {
  /** Destino del link. `null` lo deja como texto. */
  href?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: { text: "text-[0.9375rem]", mark: "size-4", gap: "gap-1.5" },
  md: { text: "text-[1.0625rem]", mark: "size-[1.125rem]", gap: "gap-2" },
  lg: { text: "text-2xl", mark: "size-6", gap: "gap-2.5" },
} as const;

/**
 * El símbolo: un triángulo de reproducción con un corte, es decir, un clip.
 * No depende del nombre; es el mismo dibujo del favicon (`src/app/icon.svg`).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2.25" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}>
      <path d="M5 3.5 11.5 7.2v9.6L5 20.5Z" />
      <path d="M15.5 9.5 19.9 12l-4.4 2.5Z" />
    </svg>
  );
}

/**
 * Wordmark tipográfico: el símbolo en el color de acento y el nombre en la
 * familia del sistema, peso 600 y tracking ajustado. Sin recuadro. El nombre
 * sale de `BRAND.name`: funciona igual con cualquier nombre corto.
 */
export function Wordmark({ href = "/", size = "md", className }: WordmarkProps) {
  const { text, mark, gap } = SIZES[size];
  const content = (
    <span className={clsx("inline-flex items-center leading-none font-semibold tracking-[-0.03em] text-ink", gap, text, className)}>
      <BrandMark className={clsx("shrink-0 text-accent", mark)} />
      {BRAND.name}
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href} aria-label={`${BRAND.name}, ir al inicio`} className="inline-flex rounded-sm">
      {content}
    </Link>
  );
}
