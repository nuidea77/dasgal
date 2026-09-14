import { ExerciseRecord } from '@/store/types';
import { PlannedExercise } from '@/domain/plan/generator';
import { SECONDS_PER_REP, getExercise } from '@/domain/plan/exercises';

/**
 * How much of a day's planned work was actually done. Held seconds are
 * converted to rep-equivalents so a plank and a set of squats are comparable.
 */
export interface SessionProgress {
  /** Rep-equivalents completed. */
  done: number;
  /** Rep-equivalents the day asked for. */
  planned: number;
  /** done / planned, clamped to 0..1. */
  ratio: number;
  /** The day counts as done at this much of the plan. */
  complete: boolean;
}

/**
 * A day ticks off at 60% of its planned volume. Below that the session is
 * still recorded and still earns XP, but the day stays open — quitting after
 * two minutes should not close out a workout the user has not really done.
 */
export const DAY_COMPLETE_RATIO = 0.6;

function repEquivalents(reps: number, holdSeconds: number): number {
  return reps + holdSeconds / SECONDS_PER_REP.strength;
}

export function plannedVolume(exercises: PlannedExercise[]): number {
  return exercises.reduce((sum, pe) => {
    const timed = getExercise(pe.exerciseId).countingMode !== 'reps_ai';
    const perSet = timed ? repEquivalents(0, pe.target) : repEquivalents(pe.target, 0);
    return sum + perSet * pe.sets;
  }, 0);
}

export function doneVolume(records: ExerciseRecord[]): number {
  return records.reduce((sum, r) => sum + repEquivalents(r.reps, r.holdSeconds), 0);
}

export function sessionProgress(exercises: PlannedExercise[], records: ExerciseRecord[]): SessionProgress {
  const planned = plannedVolume(exercises);
  const done = doneVolume(records);
  const ratio = planned <= 0 ? 0 : Math.min(1, done / planned);
  return { done, planned, ratio, complete: ratio >= DAY_COMPLETE_RATIO };
}
