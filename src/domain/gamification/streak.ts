function diffDays(a: string, b: string): number {
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((db - da) / 86400000);
}

/**
 * Computes the current streak from a list of workout dates (YYYY-MM-DD).
 * A streak counts consecutive *scheduled* days; rest days do not break it when
 * `scheduledDates` is given (only missed scheduled days break the streak).
 */
export function computeStreak(workoutDates: string[], today: string, scheduledDates?: string[]): number {
  const done = new Set(workoutDates);
  if (!scheduledDates) {
    let streak = 0;
    let cursor = today;
    // Allow today to be not-yet-done without breaking the streak.
    if (!done.has(cursor)) cursor = shiftDay(cursor, -1);
    while (done.has(cursor)) {
      streak += 1;
      cursor = shiftDay(cursor, -1);
    }
    return streak;
  }
  const scheduled = [...new Set(scheduledDates)].filter((d) => d <= today).sort();
  let streak = 0;
  for (let i = scheduled.length - 1; i >= 0; i--) {
    const d = scheduled[i]!;
    if (done.has(d)) {
      streak += 1;
    } else if (d === today) {
      continue; // today still pending
    } else {
      break;
    }
  }
  return streak;
}

export function shiftDay(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function missedScheduledDays(workoutDates: string[], scheduledDates: string[], today: string): string[] {
  const done = new Set(workoutDates);
  return scheduledDates.filter((d) => d < today && !done.has(d));
}

export { diffDays };
