import { Goal, Pace } from './types';
import { calorieDelta } from './bmi';

/** Approximate energy content of 1 kg of body fat / lean mass change. */
const KCAL_PER_KG_FAT = 7700;
const KCAL_PER_KG_LEAN = 5500;

export const PACES: Pace[] = ['easy', 'moderate', 'hard'];

/** Per-pace training load. */
export const PACE_CONFIG: Record<Pace, { daysPerWeek: number; maxLossPctPerWeek: number; maxGainKgPerWeek: number; progressionPerWorkout: number }> = {
  easy: { daysPerWeek: 3, maxLossPctPerWeek: 0.5, maxGainKgPerWeek: 0.25, progressionPerWorkout: 0.02 },
  moderate: { daysPerWeek: 4, maxLossPctPerWeek: 0.75, maxGainKgPerWeek: 0.35, progressionPerWorkout: 0.03 },
  hard: { daysPerWeek: 5, maxLossPctPerWeek: 1.0, maxGainKgPerWeek: 0.5, progressionPerWorkout: 0.04 },
};

export interface TargetTimeline {
  pace: Pace;
  /** Kilograms to lose (negative) or gain (positive). */
  deltaKg: number;
  /** Expected weekly change in kg (signed). */
  weeklyRateKg: number;
  /** Weeks needed at that rate, rounded up. 0 when already at target. */
  weeks: number;
  /** Total program length in days (weeks × 7, at least 7, at most 365). */
  programDays: number;
  /** ISO date when the target should be reached (given a start date). */
  targetDate: string;
  daysPerWeek: number;
  /** Daily calorie delta applied by this pace. */
  calorieDelta: number;
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Estimates how long a pace takes to reach the target weight.
 *
 * Weekly change = (calorie delta × 7 + workout calories) / energy per kg, then clamped to the
 * pace's safe ceiling (fraction of body weight per week when losing, kg per week when gaining).
 */
export function estimateTargetTimeline(
  weightKg: number,
  targetKg: number,
  goal: Goal,
  pace: Pace,
  workoutKcalPerSession: number,
  startDate: string,
): TargetTimeline {
  const cfg = PACE_CONFIG[pace];
  const delta = calorieDelta(goal, pace);
  const deltaKg = Math.round((targetKg - weightKg) * 10) / 10;
  if (Math.abs(deltaKg) < 0.05) {
    return { pace, deltaKg: 0, weeklyRateKg: 0, weeks: 0, programDays: 28, targetDate: addDays(startDate, 28), daysPerWeek: cfg.daysPerWeek, calorieDelta: delta };
  }
  const losing = deltaKg < 0;
  const workoutKcalPerWeek = workoutKcalPerSession * cfg.daysPerWeek;
  const weeklyKcal = Math.abs(delta) * 7 + (losing ? workoutKcalPerWeek : workoutKcalPerWeek * 0.3);
  let rate = weeklyKcal / (losing ? KCAL_PER_KG_FAT : KCAL_PER_KG_LEAN);
  const maxRate = losing ? Math.max(0.2, (weightKg * cfg.maxLossPctPerWeek) / 100) : cfg.maxGainKgPerWeek;
  rate = Math.min(maxRate, Math.max(0.1, rate));
  const weeks = Math.ceil(Math.abs(deltaKg) / rate);
  const programDays = Math.min(365, Math.max(7, weeks * 7));
  return {
    pace,
    deltaKg,
    weeklyRateKg: Math.round((losing ? -rate : rate) * 100) / 100,
    weeks,
    programDays,
    targetDate: addDays(startDate, programDays),
    daysPerWeek: cfg.daysPerWeek,
    calorieDelta: delta,
  };
}

/** The three pace options side by side, for the user to choose from. */
export function paceOptions(weightKg: number, targetKg: number, goal: Goal, workoutKcalPerSession: number, startDate: string): TargetTimeline[] {
  return PACES.map((pace) => estimateTargetTimeline(weightKg, targetKg, goal, pace, workoutKcalPerSession, startDate));
}
