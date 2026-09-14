import { estimateCalories, generatePlan, swapExercise, updateExerciseVolume } from '@/domain/plan/generator';
import { getExercise } from '@/domain/plan/exercises';
import { UserProfile } from '@/domain/profile/types';

const base: UserProfile = {
  name: 'Bat', age: 28, sex: 'male', heightCm: 175, weightKg: 72, goal: 'tone', level: 'beginner',
  targetWeightKg: 70, pace: 'moderate', preferredExercises: ['squat', 'pushup', 'plank', 'lunge', 'glute_bridge', 'jumping_jack', 'situp', 'high_knees'],
  programDays: 14, daysPerWeek: 4,
};

describe('plan generator', () => {
  it('produces the requested number of days without a 30-day cap', () => {
    expect(generatePlan(base, { startDate: '2026-01-01' }).days).toHaveLength(14);
    expect(generatePlan({ ...base, programDays: 3 }, { startDate: '2026-01-01' }).days).toHaveLength(7);
    expect(generatePlan({ ...base, programDays: 133 }, { startDate: '2026-01-01' }).days).toHaveLength(133);
    expect(generatePlan({ ...base, programDays: 999 }, { startDate: '2026-01-01' }).days).toHaveLength(365);
  });

  it('uses the preferred exercises and gets harder every workout', () => {
    const plan = generatePlan({ ...base, programDays: 84, pace: 'hard', daysPerWeek: 5 }, { startDate: '2026-01-01', seed: 2 });
    const workouts = plan.days.filter((d) => d.kind === 'workout');
    const first = workouts[0]!;
    const preferred = new Set(base.preferredExercises);
    expect(first.exercises.every((e) => preferred.has(e.exerciseId))).toBe(true);
    // Same exercise, later in the program → more reps.
    const squatTargets = workouts.filter((d) => d.intensity === 'moderate').flatMap((d) => d.exercises.filter((e) => e.exerciseId === 'squat').map((e) => e.target));
    expect(squatTargets.length).toBeGreaterThan(2);
    expect(squatTargets[squatTargets.length - 1]!).toBeGreaterThan(squatTargets[0]!);
    // Sets grow with the weeks.
    expect(workouts[workouts.length - 1]!.exercises[0]!.sets).toBeGreaterThan(first.exercises[0]!.sets);
    // Harder tiers unlock later even for a beginner.
    const lateDifficulty = Math.max(...workouts.slice(-10).flatMap((d) => d.exercises.map((e) => getExercise(e.exerciseId).difficulty)));
    expect(lateDifficulty).toBeGreaterThanOrEqual(2);
  });

  it('schedules daysPerWeek workouts per week with consecutive dates', () => {
    const plan = generatePlan(base, { startDate: '2026-01-01' });
    const firstWeek = plan.days.slice(0, 7);
    expect(firstWeek.filter((d) => d.kind === 'workout')).toHaveLength(4);
    expect(plan.days[0]!.date).toBe('2026-01-01');
    expect(plan.days[13]!.date).toBe('2026-01-14');
  });

  it('is deterministic for the same seed', () => {
    const a = generatePlan(base, { startDate: '2026-01-01', seed: 7 });
    const b = generatePlan(base, { startDate: '2026-01-01', seed: 7 });
    expect(a.days.map((d) => d.exercises.map((e) => e.exerciseId))).toEqual(b.days.map((d) => d.exercises.map((e) => e.exerciseId)));
  });

  it('caps difficulty for beginners and gives every workout day exercises', () => {
    const plan = generatePlan({ ...base, preferredExercises: [] }, { startDate: '2026-01-01', seed: 1 });
    for (const d of plan.days.filter((x) => x.kind === 'workout')) {
      expect(d.exercises.length).toBeGreaterThan(0);
      expect(d.estimatedMinutes).toBeGreaterThan(0);
      for (const e of d.exercises) {
        expect(getExercise(e.exerciseId).difficulty).toBeLessThanOrEqual(1);
        expect(e.sets).toBeGreaterThanOrEqual(3);
        expect(e.target).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('avoids high-impact moves for obese users', () => {
    const plan = generatePlan({ ...base, weightKg: 120, level: 'advanced', programDays: 30, preferredExercises: [] }, { startDate: '2026-01-01', seed: 3 });
    const ids = new Set(plan.days.flatMap((d) => d.exercises.map((e) => e.exerciseId)));
    expect(ids.has('burpee')).toBe(false);
    expect(ids.has('high_knees')).toBe(false);
  });

  it('progresses volume week over week', () => {
    const plan = generatePlan({ ...base, programDays: 21, preferredExercises: [] }, { startDate: '2026-01-01', seed: 5 });
    const w1 = plan.days.slice(0, 7).filter((d) => d.kind === 'workout' && d.intensity === 'moderate');
    const w3 = plan.days.slice(14, 21).filter((d) => d.kind === 'workout' && d.intensity === 'moderate');
    const avg = (days: typeof w1) => days.flatMap((d) => d.exercises.filter((e) => getExercise(e.exerciseId).countingMode === 'reps_ai').map((e) => e.target)).reduce((a, b, _, arr) => a + b / arr.length, 0);
    expect(avg(w3)).toBeGreaterThan(avg(w1));
  });

  it('swaps an exercise and converts reps↔seconds', () => {
    const plan = generatePlan(base, { startDate: '2026-01-01', seed: 1 });
    const day = plan.days.find((d) => d.kind === 'workout')!;
    const pe = day.exercises.find((e) => getExercise(e.exerciseId).countingMode === 'reps_ai')!;
    const swapped = swapExercise(plan, day.dayIndex, pe.key, 'plank');
    const newPe = swapped.days[day.dayIndex]!.exercises.find((e) => e.key === pe.key)!;
    expect(newPe.exerciseId).toBe('plank');
    expect(newPe.target).toBe(Math.max(20, pe.target * 3));
    const edited = updateExerciseVolume(swapped, day.dayIndex, pe.key, 5, 45);
    expect(edited.days[day.dayIndex]!.exercises.find((e) => e.key === pe.key)).toMatchObject({ sets: 5, target: 45 });
  });

  it('estimates calories scaled by body weight', () => {
    const light = estimateCalories([{ exerciseId: 'squat', count: 100 }], 50);
    const heavy = estimateCalories([{ exerciseId: 'squat', count: 100 }], 100);
    expect(heavy).toBe(light * 2);
    expect(estimateCalories([{ exerciseId: 'nope', count: 10 }], 70)).toBe(0);
  });
});
