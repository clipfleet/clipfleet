// Actividad de un gestor por día: cuántos videos aprobados cargó cada día. Funciones puras.

export const ACTIVITY_TIME_ZONE = "America/Argentina/Buenos_Aires";
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: ACTIVITY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Día calendario en Buenos Aires, "AAAA-MM-DD": un video subido a la noche no cae en el día siguiente. */
export function dayKey(date: Date): string {
  return dayFormat.format(date);
}

/** Número de día desde la época, para comparar y restar días sin depender de la zona horaria. */
function dayNumber(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
}

function keyFromNumber(number: number): string {
  return new Date(number * DAY_MS).toISOString().slice(0, 10);
}

/** Videos por día. */
export function countByDay(uploads: Date[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const date of uploads) {
    const key = dayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** La racha más larga de días seguidos con al menos un video. */
export function longestStreak(counts: Map<string, number>): number {
  const days = [...counts.keys()].map(dayNumber).sort((a, b) => a - b);
  let longest = 0;
  let current = 0;
  let previous: number | null = null;
  for (const day of days) {
    current = previous !== null && day === previous + 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = day;
  }
  return longest;
}

export type CalendarDay = {
  /** "AAAA-MM-DD". */
  date: string;
  count: number;
  /** 0 sin actividad; 1 a 4 según cuánto subió ese día respecto de su mejor día del período. */
  level: 0 | 1 | 2 | 3 | 4;
};

export type ActivityCalendar = {
  /** Semanas de lunes a domingo, de la más vieja a la actual. Los días que todavía no llegaron son null. */
  weeks: (CalendarDay | null)[][];
  /** Videos en el período mostrado. */
  total: number;
  /** Días con al menos un video en el período. */
  activeDays: number;
};

/**
 * Arma la grilla de las últimas `weekCount` semanas, terminando en la semana de `today`.
 * La intensidad es relativa al mejor día del gestor, para que sirva igual a quien sube
 * dos videos por día que a quien sube veinte.
 */
export function buildCalendar(counts: Map<string, number>, weekCount: number, today: Date = new Date()): ActivityCalendar {
  const todayNumber = dayNumber(dayKey(today));
  // Lunes de la semana actual. El día 0 de la época fue jueves: (n + 3) % 7 da 0 para lunes.
  const monday = todayNumber - ((todayNumber + 3) % 7);
  const first = monday - (weekCount - 1) * 7;

  const inRange: number[] = [];
  for (let day = first; day <= todayNumber; day++) inRange.push(counts.get(keyFromNumber(day)) ?? 0);
  const max = Math.max(0, ...inRange);

  const weeks: (CalendarDay | null)[][] = [];
  for (let week = 0; week < weekCount; week++) {
    const days: (CalendarDay | null)[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const day = first + week * 7 + weekday;
      if (day > todayNumber) {
        days.push(null);
        continue;
      }
      const date = keyFromNumber(day);
      const count = counts.get(date) ?? 0;
      const level = count === 0 ? 0 : (Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as 1 | 2 | 3 | 4);
      days.push({ date, count, level });
    }
    weeks.push(days);
  }

  return {
    weeks,
    total: inRange.reduce((sum, count) => sum + count, 0),
    activeDays: inRange.filter((count) => count > 0).length,
  };
}
