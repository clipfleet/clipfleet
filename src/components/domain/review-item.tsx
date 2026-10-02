import clsx from "clsx";
import { formatDate, isoDate } from "@/components/ui/format";
import { Rating } from "./rating";

export type ReviewItemProps = {
  /** Quién escribe la reseña. */
  authorName: string;
  /** Contexto del autor: el trabajo por el que reseña. */
  authorContext?: string;
  /** 1 a 5. */
  rating: number;
  comment: string;
  /** Fecha de la reseña (Date o ISO). */
  date: Date | string;
  className?: string;
};

/** Una reseña de una contratación terminada. Para listas: separalas con `divide-y divide-line`. */
export function ReviewItem({ authorName, authorContext, rating, comment, date, className }: ReviewItemProps) {
  return (
    <article className={clsx("flex flex-col gap-2 py-4", className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{authorName}</p>
          {authorContext ? <p className="truncate text-[0.8125rem] text-ink-3">{authorContext}</p> : null}
        </div>
        <time dateTime={isoDate(date)} className="shrink-0 text-[0.8125rem] whitespace-nowrap text-ink-3">
          {formatDate(date)}
        </time>
      </header>
      <Rating value={rating} />
      {comment ? <p className="max-w-prose text-sm text-ink-2">{comment}</p> : null}
    </article>
  );
}
