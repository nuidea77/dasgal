import { DAILY_BURN_RANGE, MAX_SESSION_MINUTES, estimateCalories, estimateDayCalories, generatePlan, swapExercise, updateExerciseVolume } from '@/domain/plan/generator';
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
    // Preferred exercises come first; the library only tops up once they are exhausted.
    expect(first.exercises.filter((e) => preferred.has(e.exerciseId)).length).toBeGreaterThanOrEqual(4);
    expect(first.exercises.slice(0, 4).every((e) => preferred.has(e.exerciseId))).toBe(true);
    // Later in the program → the session burns more (sized to a rising calorie target).
    const moderateDays = workouts.filter((d) => d.intensity === 'moderate');
    const firstBurn = estimateDayCalories(moderateDays[0]!, 72);
    const lastBurn = estimateDayCalories(moderateDays[moderateDays.length - 1]!, 72);
    expect(lastBurn).toBeGreaterThan(firstBurn);
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

  it('sizes every workout day to burn 300–600 kcal for the user', () => {
    for (const pace of ['easy', 'moderate', 'hard'] as const) {
      for (const weightKg of [55, 82, 110]) {
        const plan = generatePlan({ ...base, weightKg, pace, programDays: 56 }, { startDate: '2026-01-01', seed: 7 });
        for (const d of plan.days.filter((x) => x.kind === 'workout')) {
          const kcal = estimateDayCalories(d, weightKg);
          // Either the target is met, or the 70-minute session cap was the limit (very light users).
          expect(kcal >= DAILY_BURN_RANGE.min * 0.9 || d.estimatedMinutes >= MAX_SESSION_MINUTES - 5).toBe(true);
          expect(kcal).toBeLessThanOrEqual(DAILY_BURN_RANGE.max * 1.15);
          expect(d.estimatedMinutes).toBeLessThanOrEqual(MAX_SESSION_MINUTES + 10);
        }
      }
    }
    // Harder pace → higher daily burn.
    const easy = generatePlan({ ...base, pace: 'easy', programDays: 14 }, { startDate: '2026-01-01', seed: 7 });
    const hard = generatePlan({ ...base, pace: 'hard', programDays: 14 }, { startDate: '2026-01-01', seed: 7 });
    const avg = (p: typeof easy) => { const w = p.days.filter((d) => d.kind === 'workout'); return w.reduce((s, d) => s + estimateDayCalories(d, 72), 0) / w.length; };
    expect(avg(hard)).toBeGreaterThan(avg(easy));
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
    expect(Math.abs(heavy - light * 2)).toBeLessThanOrEqual(1);
    expect(estimateCalories([{ exerciseId: 'nope', count: 10 }], 70)).toBe(0);
  });
});
