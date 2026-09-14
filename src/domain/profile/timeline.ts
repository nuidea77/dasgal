import { Goal } from './types';

/** Approximate energy content of 1 kg of body fat / lean mass change. */
const KCAL_PER_KG_FAT = 7700;
const KCAL_PER_KG_LEAN = 5500;

export interface TargetTimeline {
  /** Kilograms to lose (negative) or gain (positive). */
  deltaKg: number;
  /** Expected weekly change in kg (signed). */
  weeklyRateKg: number;
  /** Weeks needed at that rate, rounded up. 0 when already at target. */
  weeks: number;
  /** ISO date when the target should be reached (given a start date). */
  targetDate: string;
  /** Suggested length of the first program cycle in days (7..30). */
  suggestedProgramDays: number;
  /** Number of program cycles (of suggestedProgramDays) needed to reach the target. */
  cycles: number;
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Estimates how long it takes to reach the target weight given the daily calorie
 * delta of the plan plus the calories burned by the scheduled workouts.
 *
 * The rate is clamped to a safe range: at most 1% of body weight per week when
 * losing, at most 0.5 kg per week when gaining lean mass.
 */
export function estimateTargetTimeline(
  weightKg: number,
  targetKg: number,
  goal: Goal,
  dailyCalorieDelta: number,
  workoutKcalPerWeek: number,
  startDate: string,
): TargetTimeline {
  const deltaKg = Math.round((targetKg - weightKg) * 10) / 10;
  if (Math.abs(deltaKg) < 0.05) {
    return { deltaKg: 0, weeklyRateKg: 0, weeks: 0, targetDate: startDate, suggestedProgramDays: 14, cycles: 1 };
  }
  const losing = deltaKg < 0;
  const weeklyKcal = Math.abs(dailyCalorieDelta) * 7 + (losing ? workoutKcalPerWeek : 0);
  let rate = weeklyKcal / (losing ? KCAL_PER_KG_FAT : KCAL_PER_KG_LEAN);
  const maxRate = losing ? Math.max(0.25, weightKg * 0.01) : 0.5;
  const minRate = 0.15;
  rate = Math.min(maxRate, Math.max(minRate, rate));
  const weeklyRateKg = Math.round((losing ? -rate : rate) * 100) / 100;
  const weeks = Math.ceil(Math.abs(deltaKg) / rate);
  const totalDays = weeks * 7;
  const suggestedProgramDays = Math.min(30, Math.max(7, Math.ceil(totalDays / 7) * 7));
  const cycles = Math.max(1, Math.ceil(totalDays / suggestedProgramDays));
  return { deltaKg, weeklyRateKg, weeks, targetDate: addDays(startDate, totalDays), suggestedProgramDays, cycles };
}
