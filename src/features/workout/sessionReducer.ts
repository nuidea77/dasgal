import { AnalysisResult } from '@/domain/pose/repEngine';
import { PlannedExercise } from '@/domain/plan/generator';
import { getExercise } from '@/domain/plan/exercises';
import { ExerciseRecord } from '@/store/types';

export type SessionStatus = 'positioning' | 'countdown' | 'exercising' | 'rest' | 'paused' | 'complete';

export interface SessionState {
  exercises: PlannedExercise[];
  status: SessionStatus;
  exerciseIndex: number;
  setIndex: number;
  /** Seconds left in countdown / rest, or seconds elapsed for timed sets. */
  countdown: number;
  restLeft: number;
  elapsedInSet: number;
  currentReps: number;
  currentHold: number;
  /** Quality samples for the current exercise. */
  qualitySamples: number[];
  records: ExerciseRecord[];
  pausedFrom: SessionStatus | null;
  /** Total seconds elapsed. */
  elapsedTotal: number;
  /** Set to a truthy token when a set has just been completed (for voice/haptics). */
  event: 'set_done' | 'exercise_done' | 'rep' | 'workout_done' | null;
}

export type SessionAction =
  | { type: 'FRAMING_OK' }
  | { type: 'TICK' }
  | { type: 'ANALYSIS'; result: AnalysisResult }
  | { type: 'MANUAL_REP' }
  | { type: 'SKIP_REST' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'FINISH' };

export const COUNTDOWN_SECONDS = 3;

export function createSession(exercises: PlannedExercise[]): SessionState {
  return {
    exercises,
    status: 'positioning',
    exerciseIndex: 0,
    setIndex: 0,
    countdown: COUNTDOWN_SECONDS,
    restLeft: 0,
    elapsedInSet: 0,
    currentReps: 0,
    currentHold: 0,
    qualitySamples: [],
    records: [],
    pausedFrom: null,
    elapsedTotal: 0,
    event: null,
  };
}

export function currentExercise(s: SessionState): PlannedExercise | undefined {
  return s.exercises[s.exerciseIndex];
}

function targetReached(s: SessionState): boolean {
  const pe = currentExercise(s);
  if (!pe) return true;
  const ex = getExercise(pe.exerciseId);
  if (ex.countingMode === 'reps_ai') return s.currentReps >= pe.target;
  if (ex.countingMode === 'hold_ai') return s.currentHold >= pe.target;
  return s.elapsedInSet >= pe.target;
}

function finishSet(s: SessionState): SessionState {
  const pe = currentExercise(s);
  if (!pe) return { ...s, status: 'complete', event: 'workout_done' };
  const ex = getExercise(pe.exerciseId);
  // Accumulate into the record for this exercise.
  const records = [...s.records];
  const existing = records.find((r) => r.exerciseId === pe.exerciseId && records.indexOf(r) === s.exerciseIndex);
  const quality = s.qualitySamples.length ? s.qualitySamples.reduce((a, b) => a + b, 0) / s.qualitySamples.length : 1;
  const repsDone = ex.countingMode === 'reps_ai' ? s.currentReps : 0;
  const holdDone = ex.countingMode === 'reps_ai' ? 0 : ex.countingMode === 'hold_ai' ? Math.round(s.currentHold) : s.elapsedInSet;
  if (existing && records[s.exerciseIndex]) {
    records[s.exerciseIndex] = {
      ...existing,
      sets: existing.sets + 1,
      reps: existing.reps + repsDone,
      holdSeconds: existing.holdSeconds + holdDone,
      quality: (existing.quality * existing.sets + quality) / (existing.sets + 1),
    };
  } else {
    records[s.exerciseIndex] = { exerciseId: pe.exerciseId, sets: 1, reps: repsDone, holdSeconds: holdDone, quality };
  }

  const lastSet = s.setIndex >= pe.sets - 1;
  const lastExercise = s.exerciseIndex >= s.exercises.length - 1;
  if (lastSet && lastExercise) {
    return { ...s, records, status: 'complete', event: 'workout_done' };
  }
  return {
    ...s,
    records,
    status: 'rest',
    restLeft: pe.restSeconds,
    event: lastSet ? 'exercise_done' : 'set_done',
  };
}

function advanceAfterRest(s: SessionState): SessionState {
  const pe = currentExercise(s);
  if (!pe) return { ...s, status: 'complete' };
  const lastSet = s.setIndex >= pe.sets - 1;
  const base = { ...s, currentReps: 0, currentHold: 0, elapsedInSet: 0, countdown: COUNTDOWN_SECONDS, event: null as SessionState['event'] };
  if (!lastSet) {
    return { ...base, setIndex: s.setIndex + 1, status: 'countdown' };
  }
  const next = s.exercises[s.exerciseIndex + 1];
  const needsReposition = next ? getExercise(next.exerciseId).cameraHint !== getExercise(pe.exerciseId).cameraHint : false;
  return {
    ...base,
    exerciseIndex: s.exerciseIndex + 1,
    setIndex: 0,
    qualitySamples: [],
    status: needsReposition ? 'positioning' : 'countdown',
  };
}

export function sessionReducer(s: SessionState, a: SessionAction): SessionState {
  switch (a.type) {
    case 'FRAMING_OK':
      return s.status === 'positioning' ? { ...s, status: 'countdown', countdown: COUNTDOWN_SECONDS, event: null } : s;
    case 'TICK': {
      const st = { ...s, elapsedTotal: s.status === 'paused' ? s.elapsedTotal : s.elapsedTotal + 1, event: null as SessionState['event'] };
      if (s.status === 'countdown') {
        if (s.countdown <= 1) return { ...st, status: 'exercising', countdown: 0 };
        return { ...st, countdown: s.countdown - 1 };
      }
      if (s.status === 'rest') {
        if (s.restLeft <= 1) return advanceAfterRest({ ...st, restLeft: 0 });
        return { ...st, restLeft: s.restLeft - 1 };
      }
      if (s.status === 'exercising') {
        const pe = currentExercise(s);
        if (pe && getExercise(pe.exerciseId).countingMode === 'timed') {
          const next = { ...st, elapsedInSet: s.elapsedInSet + 1 };
          return targetReached(next) ? finishSet(next) : next;
        }
      }
      return st;
    }
    case 'ANALYSIS': {
      if (s.status !== 'exercising') return s;
      const pe = currentExercise(s);
      if (!pe) return s;
      const ex = getExercise(pe.exerciseId);
      if (ex.countingMode === 'reps_ai') {
        if (!a.result.repCounted) return s.event ? { ...s, event: null } : s;
        const next = {
          ...s,
          currentReps: s.currentReps + 1,
          qualitySamples: [...s.qualitySamples, a.result.lastRepQuality],
          event: 'rep' as const,
        };
        return targetReached(next) ? finishSet(next) : next;
      }
      if (ex.countingMode === 'hold_ai') {
        const next = { ...s, currentHold: a.result.holdSeconds, event: null as SessionState['event'] };
        return targetReached(next) ? finishSet(next) : next;
      }
      return s;
    }
    case 'MANUAL_REP': {
      if (s.status !== 'exercising') return s;
      const pe = currentExercise(s);
      if (!pe || getExercise(pe.exerciseId).countingMode !== 'reps_ai') return s;
      const next = { ...s, currentReps: s.currentReps + 1, qualitySamples: [...s.qualitySamples, 0.8], event: 'rep' as const };
      return targetReached(next) ? finishSet(next) : next;
    }
    case 'SKIP_REST':
      return s.status === 'rest' ? advanceAfterRest({ ...s, restLeft: 0 }) : s;
    case 'PAUSE':
      return s.status === 'paused' || s.status === 'complete' ? s : { ...s, status: 'paused', pausedFrom: s.status, event: null };
    case 'RESUME':
      return s.status === 'paused' ? { ...s, status: s.pausedFrom === 'exercising' ? 'countdown' : (s.pausedFrom ?? 'positioning'), countdown: COUNTDOWN_SECONDS, pausedFrom: null } : s;
    case 'FINISH': {
      if (s.status === 'complete') return s;
      // Count whatever was done in the current set, then finish.
      const partial = s.currentReps > 0 || s.currentHold > 0 || s.elapsedInSet > 0 ? finishSet(s) : s;
      return { ...partial, status: 'complete', event: 'workout_done' };
    }
    default:
      return s;
  }
}

export function summarize(s: SessionState): { totalReps: number; totalHoldSeconds: number; avgQuality: number } {
  const totalReps = s.records.reduce((a, r) => a + (r?.reps ?? 0), 0);
  const totalHoldSeconds = s.records.reduce((a, r) => a + (r?.holdSeconds ?? 0), 0);
  const valid = s.records.filter(Boolean);
  const avgQuality = valid.length ? valid.reduce((a, r) => a + r.quality, 0) / valid.length : 1;
  return { totalReps, totalHoldSeconds, avgQuality };
}
