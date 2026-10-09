import type { SVGProps } from "react";

/**
 * Íconos propios, 16×16, trazo de 1.5. Son decorativos (aria-hidden): el texto
 * de al lado es el que informa. No se usan emojis como íconos.
 */
type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Svg({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ---- Estado y dirección ---- */

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3 8.5 3.25 3.25L13 4.5" />
    </Svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 2.25 14.25 13H1.75L8 2.25Z" />
      <path d="M8 6.5v3" />
      <path d="M8 11.25v.01" />
    </Svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.25v3.5" />
      <path d="M8 5.1v.01" />
    </Svg>
  );
}

export function CrossIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4 4 8 8M12 4l-8 8" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.75 8h10.5M9.5 4.25 13.25 8 9.5 11.75" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.25 8H2.75M6.5 4.25 2.75 8l3.75 3.75" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4 6 4 4 4-4" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 4 4 4-4 4" />
    </Svg>
  );
}

/** Link que abre otra pestaña. */
export function ExternalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 2.75h3.75V6.5" />
      <path d="M13.25 2.75 7.75 8.25" />
      <path d="M11.5 9.25v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3" />
    </Svg>
  );
}

/** Estrella llena: solo para la calificación de una reseña. */
export function StarIcon(props: IconProps) {
  return (
    <Svg strokeWidth="1" fill="currentColor" {...props}>
      <path d="m8 2 1.8 3.75 4.1.55-3 2.85.75 4.05L8 11.25 4.35 13.2l.75-4.05-3-2.85 4.1-.55L8 2Z" />
    </Svg>
  );
}

/* ---- Navegación del panel ---- */

export function TeamIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="5.25" r="2.25" />
      <path d="M1.75 13.25c0-2.35 1.9-4.25 4.25-4.25s4.25 1.9 4.25 4.25" />
      <path d="M10.5 3.2a2.25 2.25 0 0 1 0 4.1" />
      <path d="M12 9.3c1.35.65 2.25 2 2.25 3.95" />
    </Svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M1.75 8h12.5" />
      <path d="M8 1.75c1.6 1.7 2.5 3.9 2.5 6.25S9.6 12.55 8 14.25C6.4 12.55 5.5 10.35 5.5 8S6.4 3.45 8 1.75Z" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="7" cy="7" r="4.25" />
      <path d="m10.25 10.25 3.5 3.5" />
    </Svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.75 2.25h8.5v11.5l-2.125-1.25L8 13.75 5.875 12.5 3.75 13.75V2.25Z" />
      <path d="M6 5.75h4M6 8.5h4" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 13.5c0-2.6 2.2-4.5 5-4.5s5 1.9 5 4.5" />
    </Svg>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="4.75" width="12" height="8.5" rx="1.5" />
      <path d="M5.75 4.75V3.5a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1v1.25" />
      <path d="M2 8.5h12" />
    </Svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 2 7.25 8.75" />
      <path d="M14 2 9.75 14l-2.5-5.25L2 6.25 14 2Z" />
    </Svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.25" y="2.25" width="4.5" height="4.5" rx="1" />
      <rect x="9.25" y="2.25" width="4.5" height="4.5" rx="1" />
      <rect x="2.25" y="9.25" width="4.5" height="4.5" rx="1" />
      <rect x="9.25" y="9.25" width="4.5" height="4.5" rx="1" />
    </Svg>
  );
}
