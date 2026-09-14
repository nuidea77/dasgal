import { PlanDay, WorkoutPlan } from './generator';

export type DayState = 'done' | 'missed' | 'workout' | 'rest' | 'outside';

export interface StripDay {
  /** Local ISO date (YYYY-MM-DD). */
  date: string;
  /** 0 = Sunday … 6 = Saturday, for the weekday label. */
  weekday: number;
  /** Day of month. */
  dayOfMonth: number;
  /** Index into plan.days, or null when the date is outside the program. */
  dayIndex: number | null;
  state: DayState;
  isToday: boolean;
}

function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}

/** Monday of the week containing `iso`. */
export function weekStart(iso: string): string {
  const d = parse(iso);
  const dow = d.getUTCDay(); // 0 = Sunday
  return addDays(iso, dow === 0 ? -6 : 1 - dow);
}

/**
 * Builds a continuous Monday-aligned list of days covering the whole program,
 * so the strip can be scrolled week by week. Days before the start or after the
 * end of the program are included as 'outside' so every week has seven cells.
 */
export function buildStrip(plan: WorkoutPlan, completedDates: Record<string, string>, penalizedDates: string[], today: string): StripDay[] {
  const first = plan.days[0];
  const last = plan.days[plan.days.length - 1];
  if (!first || !last) return [];
  const byDate = new Map<string, PlanDay>(plan.days.map((d) => [d.date, d]));
  const penalized = new Set(penalizedDates);
  const start = weekStart(first.date);
  const end = addDays(weekStart(last.date), 6);
  const out: StripDay[] = [];
  for (let iso = start; iso <= end; iso = addDays(iso, 1)) {
    const day = byDate.get(iso);
    const done = Boolean(completedDates[iso]);
    const state: DayState = !day
      ? 'outside'
      : done
        ? 'done'
        : day.kind === 'rest'
          ? 'rest'
          : penalized.has(iso) || iso < today
            ? 'missed'
            : 'workout';
    out.push({
      date: iso,
      weekday: parse(iso).getUTCDay(),
      dayOfMonth: parse(iso).getUTCDate(),
      dayIndex: day ? day.dayIndex : null,
      state,
      isToday: iso === today,
    });
  }
  return out;
}

/** Index of the week (0-based) containing `iso` inside a strip. */
export function weekIndexOf(strip: StripDay[], iso: string): number {
  const i = strip.findIndex((d) => d.date === iso);
  if (i < 0) return 0;
  return Math.floor(i / 7);
}
