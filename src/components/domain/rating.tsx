import clsx from "clsx";
import { formatRating } from "@/components/ui/format";
import { StarIcon } from "@/components/ui/icons";

export type RatingProps = {
  /** Calificación de 1 a 5. `null` = sin calificación. */
  value: number | null;
  className?: string;
};

/** Calificación de una reseña: cinco estrellas chicas, en tinta. Solo para reseñas. */
export function Rating({ value, className }: RatingProps) {
  if (value === null) {
    return <span className={clsx("text-ink-3", className)}>—</span>;
  }
  const clamped = Math.max(0, Math.min(5, value));
  const filled = Math.round(clamped);
  return (
    <span className={clsx("inline-flex items-center gap-0.5 whitespace-nowrap", className)}>
      <span className="sr-only">{formatRating(clamped)} de 5</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} className={clsx("size-3.5", star <= filled ? "text-ink" : "text-line-strong")} />
      ))}
    </span>
  );
}
