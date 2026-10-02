import clsx from "clsx";
import { initials } from "./format";

export type AvatarSize = "sm" | "md" | "lg";

export type AvatarProps = {
  /** Nombre de la persona o marca: de acá salen las iniciales. */
  name: string;
  size?: AvatarSize;
  className?: string;
};

const SIZES: Record<AvatarSize, string> = {
  sm: "size-7 text-[0.6875rem]",
  md: "size-8 text-xs",
  lg: "size-14 text-lg",
};

/** Iniciales en un círculo neutro. Decorativo: el nombre siempre va escrito al lado. No hay fotos. */
export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-wash-2 font-medium tracking-wide text-ink-2 select-none",
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
