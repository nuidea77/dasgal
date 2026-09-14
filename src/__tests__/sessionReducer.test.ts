import { PlannedExercise } from '@/domain/plan/generator';
import { AnalysisResult } from '@/domain/pose/repEngine';
import { COUNTDOWN_SECONDS, createSession, sessionReducer, summarize } from '@/features/workout/sessionReducer';

const rep = (quality = 0.9): AnalysisResult => ({ phase: 'rest', repCounted: true, reps: 0, feedback: [], metric: 90, lastRepQuality: quality, holdSeconds: 0 });
const hold = (seconds: number): AnalysisResult => ({ phase: 'active', repCounted: false, reps: 0, feedback: [], metric: null, lastRepQuality: 1, holdSeconds: seconds });

const exercises: PlannedExercise[] = [
  { key: 'a', exerciseId: 'squat', sets: 2, target: 2, restSeconds: 2 },
  { key: 'b', exerciseId: 'plank', sets: 1, target: 3, restSeconds: 2 },
  { key: 'c', exerciseId: 'jumping_jack', sets: 1, target: 1, restSeconds: 2 },
];

function tick(s: ReturnType<typeof createSession>, n = 1) {
  for (let i = 0; i < n; i++) s = sessionReducer(s, { type: 'TICK' });
  return s;
}

describe('workout session reducer', () => {
  it('walks positioning → countdown → sets → rest → next exercise → complete', () => {
    let s = createSession(exercises);
    expect(s.status).toBe('positioning');
    s = sessionReducer(s, { type: 'FRAMING_OK' });
    expect(s.status).toBe('countdown');
    s = tick(s, COUNTDOWN_SECONDS);
    expect(s.status).toBe('exercising');

    s = sessionReducer(s, { type: 'ANALYSIS', result: rep() });
    expect(s.currentReps).toBe(1);
    expect(s.event).toBe('rep');
    s = sessionReducer(s, { type: 'ANALYSIS', result: rep(0.7) });
    expect(s.status).toBe('rest');
    expect(s.event).toBe('set_done');
    expect(s.records[0]).toMatchObject({ exerciseId: 'squat', sets: 1, reps: 2 });

    s = sessionReducer(s, { type: 'SKIP_REST' });
    expect(s.status).toBe('countdown');
    expect(s.setIndex).toBe(1);
    s = tick(s, COUNTDOWN_SECONDS);
    s = sessionReducer(s, { type: 'ANALYSIS', result: rep() });
    s = sessionReducer(s, { type: 'ANALYSIS', result: rep() });
    expect(s.event).toBe('exercise_done');
    expect(s.records[0]).toMatchObject({ sets: 2, reps: 4 });

    // Rest counts down then moves to the plank (same camera side → countdown, no repositioning).
    s = tick(s, 2);
    expect(s.exerciseIndex).toBe(1);
    expect(s.status).toBe('countdown');
    s = tick(s, COUNTDOWN_SECONDS);
    s = sessionReducer(s, { type: 'ANALYSIS', result: hold(1.5) });
    expect(s.status).toBe('exercising');
    s = sessionReducer(s, { type: 'ANALYSIS', result: hold(3.2) });
    expect(s.status).toBe('rest');
    expect(s.records[1]).toMatchObject({ exerciseId: 'plank', holdSeconds: 3 });

    // Jumping jack is a front-camera exercise → repositioning required.
    s = sessionReducer(s, { type: 'SKIP_REST' });
    expect(s.status).toBe('positioning');
    s = sessionReducer(s, { type: 'FRAMING_OK' });
    s = tick(s, COUNTDOWN_SECONDS);
    s = sessionReducer(s, { type: 'MANUAL_REP' });
    expect(s.status).toBe('complete');
    expect(s.event).toBe('workout_done');
    const sum = summarize(s);
    expect(sum.totalReps).toBe(5);
    expect(sum.totalHoldSeconds).toBe(3);
    expect(sum.avgQuality).toBeGreaterThan(0.8);
  });

  it('runs timed exercises off the clock', () => {
    let s = createSession([{ key: 'x', exerciseId: 'burpee', sets: 1, target: 3, restSeconds: 5 }]);
    s = sessionReducer(s, { type: 'FRAMING_OK' });
    s = tick(s, COUNTDOWN_SECONDS);
    s = sessionReducer(s, { type: 'ANALYSIS', result: rep() }); // ignored for timed
    expect(s.currentReps).toBe(0);
    s = tick(s, 3);
    expect(s.status).toBe('complete');
    expect(s.records[0]).toMatchObject({ exerciseId: 'burpee', holdSeconds: 3 });
  });

  it('pauses, resumes with a fresh countdown and finishes early with partial credit', () => {
    let s = createSession(exercises);
    s = sessionReducer(s, { type: 'FRAMING_OK' });
    s = tick(s, COUNTDOWN_SECONDS);
    s = sessionReducer(s, { type: 'ANALYSIS', result: rep() });
    s = sessionReducer(s, { type: 'PAUSE' });
    expect(s.status).toBe('paused');
    const before = s.elapsedTotal;
    s = tick(s, 5);
    expect(s.elapsedTotal).toBe(before);
    s = sessionReducer(s, { type: 'RESUME' });
    expect(s.status).toBe('countdown');
    expect(s.currentReps).toBe(1);
    s = tick(s, COUNTDOWN_SECONDS);
    s = sessionReducer(s, { type: 'FINISH' });
    expect(s.status).toBe('complete');
    expect(summarize(s).totalReps).toBe(1);
  });
});
