import { DAY_COMPLETE_RATIO, doneVolume, plannedVolume, sessionProgress } from '@/domain/workout/completion';
import { PlannedExercise } from '@/domain/plan/generator';

const reps = (exerciseId: string, sets: number, target: number): PlannedExercise => ({
  key: `${exerciseId}-1`, exerciseId, sets, target, restSeconds: 45,
});

describe('session completion', () => {
  it('counts planned reps across sets', () => {
    expect(plannedVolume([reps('squat', 3, 12)])).toBe(36);
  });

  it('converts held seconds to rep-equivalents', () => {
    // plank is timed: 2 sets of 30s = 60s / 3s per rep = 20 rep-equivalents.
    expect(plannedVolume([reps('plank', 2, 30)])).toBeCloseTo(20);
    expect(doneVolume([{ exerciseId: 'plank', sets: 2, reps: 0, holdSeconds: 60, quality: 1 }])).toBeCloseTo(20);
  });

  it('marks the day complete only past the threshold', () => {
    const plan = [reps('squat', 3, 10)]; // 30
    const partial = sessionProgress(plan, [{ exerciseId: 'squat', sets: 2, reps: 17, holdSeconds: 0, quality: 1 }]);
    expect(partial.ratio).toBeCloseTo(17 / 30);
    expect(partial.complete).toBe(false);

    const enough = sessionProgress(plan, [{ exerciseId: 'squat', sets: 2, reps: 18, holdSeconds: 0, quality: 1 }]);
    expect(enough.ratio).toBeGreaterThanOrEqual(DAY_COMPLETE_RATIO);
    expect(enough.complete).toBe(true);
  });

  it('clamps overachievement to 100%', () => {
    const p = sessionProgress([reps('squat', 1, 10)], [{ exerciseId: 'squat', sets: 1, reps: 25, holdSeconds: 0, quality: 1 }]);
    expect(p.ratio).toBe(1);
  });

  it('treats an empty plan as no progress rather than dividing by zero', () => {
    const p = sessionProgress([], []);
    expect(p.ratio).toBe(0);
    expect(p.complete).toBe(false);
  });
});
