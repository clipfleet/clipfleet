import clsx from "clsx";
import Link from "next/link";
import { useId } from "react";
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
 * El símbolo: dos arcos encastrados, con el degradé verde de la marca.
 * Es el mismo dibujo del favicon (`src/app/icon.svg`); la fuente original
 * está en `assets/brand/mark.svg`.
 */
export function BrandMark({ className }: { className?: string }) {
  // Un id por instancia: puede haber varias marcas en la misma página.
  const gradient = useId();
  return (
    <svg viewBox="91 91 330 330" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={gradient} x1="91" y1="91" x2="421" y2="421" gradientUnits="userSpaceOnUse">
          <stop stopColor="#09573F" />
          <stop offset="0.5" stopColor="#0C6B4E" />
          <stop offset="1" stopColor="#17966D" />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradient})`}>
        <path d="M91 289V211C91 179.174 103.643 148.652 126.147 126.147C148.652 103.643 179.174 91 211 91C242.826 91 273.348 103.643 295.853 126.147C318.357 148.652 331 179.174 331 211V289H271V211C271 195.087 264.679 179.826 253.426 168.574C242.174 157.321 226.913 151 211 151C195.087 151 179.826 157.321 168.574 168.574C157.321 179.826 151 195.087 151 211V289H91Z" />
        <path d="M181 223H241V301C241 316.913 247.321 332.174 258.574 343.426C269.826 354.679 285.087 361 301 361C316.913 361 332.174 354.679 343.426 343.426C354.679 332.174 361 316.913 361 301V223H421V301C421 332.826 408.357 363.348 385.853 385.853C363.348 408.357 332.826 421 301 421C269.174 421 238.652 408.357 216.147 385.853C193.643 363.348 181 332.826 181 301V223Z" />
      </g>
    </svg>
  );
}

/**
 * Wordmark tipográfico: el símbolo y el nombre en la
 * familia del sistema, peso 600 y tracking ajustado. Sin recuadro. El nombre
 * sale de `BRAND.name`: funciona igual con cualquier nombre corto.
 */
export function Wordmark({ href = "/", size = "md", className }: WordmarkProps) {
  const { text, mark, gap } = SIZES[size];
  const content = (
    <span className={clsx("inline-flex items-center leading-none font-semibold tracking-[-0.03em] text-ink", gap, text, className)}>
      <BrandMark className={clsx("shrink-0", mark)} />
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
