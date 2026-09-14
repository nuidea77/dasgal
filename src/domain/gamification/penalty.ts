/** XP lost for every scheduled workout day that was skipped. */
export const MISSED_WORKOUT_XP = 30;

/**
 * Scheduled workout dates strictly before `today` that were neither completed nor already
 * penalised. The program itself never resets: missed days simply stay missed.
 */
export function missedPenaltyDates(scheduledDates: string[], completedDates: string[], penalizedDates: string[], today: string): string[] {
  const done = new Set(completedDates);
  const penalized = new Set(penalizedDates);
  return scheduledDates.filter((d) => d < today && !done.has(d) && !penalized.has(d)).sort();
}
