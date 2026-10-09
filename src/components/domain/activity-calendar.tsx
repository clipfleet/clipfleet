import clsx from "clsx";
import type { ActivityCalendar as Calendar, CalendarDay } from "@/lib/stats/activity";

const LEVEL: Record<CalendarDay["level"], string> = {
  0: "bg-wash-2",
  1: "bg-accent/25",
  2: "bg-accent/50",
  3: "bg-accent/75",
  4: "bg-accent",
};

const monthFormat = new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });

const asDate = (key: string) => new Date(`${key}T00:00:00Z`);
const monthLabel = (key: string) => monthFormat.format(asDate(key)).replace(".", "");
const dayLabel = (key: string) => dayFormat.format(asDate(key)).replace(".", "");

function videos(count: number): string {
  return count === 1 ? "1 video" : `${count} videos`;
}

/**
 * Actividad del gestor por día: una columna por semana (de lunes a domingo), más verde cuantos
 * más videos subió ese día. Ocupa el ancho disponible, así entra completa también en el celular.
 */
export function ActivityCalendar({ calendar, className }: { calendar: Calendar; className?: string }) {
  const { weeks } = calendar;
  const columns = { gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` };

  // El mes se rotula en la primera semana que empieza en ese mes.
  const months = weeks.map((week, index) => {
    const monday = week[0]?.date;
    const previous = weeks[index - 1]?.[0]?.date;
    if (!monday || index >= weeks.length - 1) return null;
    return !previous || monday.slice(0, 7) !== previous.slice(0, 7) ? monthLabel(monday) : null;
  });

  return (
    <div
      role="img"
      aria-label={`${videos(calendar.total)} en las últimas ${weeks.length} semanas, en ${calendar.activeDays} ${calendar.activeDays === 1 ? "día" : "días"}`}
      className={clsx("flex w-full max-w-[34rem] flex-col gap-1.5", className)}
    >
      <div className="grid gap-[3px] text-[0.6875rem] leading-4 text-ink-3" style={columns}>
        {months.map((label, index) => (
          <span key={index} className="relative h-4">
            {label ? <span className="absolute left-0 whitespace-nowrap">{label}</span> : null}
          </span>
        ))}
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={columns}>
        {weeks.flatMap((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <span
              key={`${weekIndex}-${dayIndex}`}
              title={day ? `${day.count === 0 ? "Sin videos" : videos(day.count)} · ${dayLabel(day.date)}` : undefined}
              className={clsx("aspect-square w-full rounded-[2px]", day ? LEVEL[day.level] : "invisible")}
            />
          )),
        )}
      </div>
      <p aria-hidden="true" className="flex items-center justify-end gap-1 text-[0.6875rem] leading-4 text-ink-3">
        Menos
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={clsx("size-2.5 rounded-[2px]", LEVEL[level])} />
        ))}
        Más
      </p>
    </div>
  );
}
