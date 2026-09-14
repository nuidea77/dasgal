/** Context the daily message is picked from. */
export interface MotivationContext {
  /** Consecutive completed scheduled days. */
  streakDays: number;
  /** Workouts completed in this program. */
  workoutsDone: number;
  /** Scheduled workouts in this program. */
  workoutsTotal: number;
  /** True when today is a rest day. */
  restDay: boolean;
  /** True when today's workout is already done. */
  doneToday: boolean;
  /** Scheduled days skipped so far. */
  missedDays: number;
  /** Kilograms still to go toward the target (absolute). */
  kgToGo: number;
}

export type MotivationTone = 'streak' | 'comeback' | 'rest' | 'done' | 'final_push' | 'start' | 'daily';

export interface MotivationPick {
  tone: MotivationTone;
  /** Index into the tone's message list in the dictionary. */
  index: number;
}

/** Number of messages available per tone (must match the i18n lists). */
export const MOTIVATION_COUNTS: Record<MotivationTone, number> = {
  streak: 4,
  comeback: 4,
  rest: 4,
  done: 4,
  final_push: 3,
  start: 4,
  daily: 8,
};

function dayHash(dateIso: string): number {
  let h = 0;
  for (let i = 0; i < dateIso.length; i++) h = (h * 31 + dateIso.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Picks the message that fits today: celebrate a streak, welcome someone back after a
 * skipped day, cheer the final stretch, and otherwise rotate the daily lines by date
 * so the same message does not repeat two days running.
 */
export function pickMotivation(ctx: MotivationContext, dateIso: string): MotivationPick {
  const h = dayHash(dateIso);
  const tone: MotivationTone = ctx.doneToday
    ? 'done'
    : ctx.restDay
      ? 'rest'
      : ctx.workoutsDone === 0
        ? 'start'
        : ctx.missedDays > 0 && ctx.streakDays === 0
          ? 'comeback'
          : ctx.workoutsTotal > 0 && ctx.workoutsDone / ctx.workoutsTotal >= 0.8
            ? 'final_push'
            : ctx.streakDays >= 3
              ? 'streak'
              : 'daily';
  return { tone, index: h % MOTIVATION_COUNTS[tone] };
}
