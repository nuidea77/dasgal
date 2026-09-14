import { buildStrip, weekIndexOf, weekStart } from '@/domain/plan/weekStrip';
import { generatePlan } from '@/domain/plan/generator';
import { UserProfile } from '@/domain/profile/types';

const profile: UserProfile = {
  name: 'Bat', age: 28, sex: 'male', heightCm: 175, weightKg: 72, goal: 'tone', level: 'beginner',
  targetWeightKg: 70, pace: 'moderate', preferredExercises: [], programDays: 21, daysPerWeek: 4,
};

describe('week strip', () => {
  it('finds the Monday of a week', () => {
    expect(weekStart('2026-01-01')).toBe('2025-12-29'); // Thursday -> Monday
    expect(weekStart('2026-01-05')).toBe('2026-01-05'); // already Monday
    expect(weekStart('2026-01-04')).toBe('2025-12-29'); // Sunday -> previous Monday
  });

  it('produces whole Monday-aligned weeks covering the program', () => {
    const plan = generatePlan(profile, { startDate: '2026-01-01', seed: 1 });
    const strip = buildStrip(plan, {}, [], '2026-01-01');
    expect(strip.length % 7).toBe(0);
    expect(strip[0]!.date).toBe('2025-12-29');
    expect(strip[0]!.weekday).toBe(1); // Monday
    expect(strip[strip.length - 1]!.weekday).toBe(0); // Sunday
    // Days before the program start are marked outside.
    expect(strip[0]!.state).toBe('outside');
    expect(strip[0]!.dayIndex).toBeNull();
    expect(strip.filter((d) => d.dayIndex !== null)).toHaveLength(21);
  });

  it('marks done, missed, rest and today', () => {
    const plan = generatePlan(profile, { startDate: '2026-01-01', seed: 1 });
    const workoutDates = plan.days.filter((d) => d.kind === 'workout').map((d) => d.date);
    const strip = buildStrip(plan, { [workoutDates[0]!]: 'rec1' }, [], '2026-01-05');
    const byDate = new Map(strip.map((d) => [d.date, d]));
    expect(byDate.get(workoutDates[0]!)!.state).toBe('done');
    // A workout day in the past that was not completed counts as missed.
    const pastMissed = workoutDates.find((d) => d < '2026-01-05' && d !== workoutDates[0]);
    if (pastMissed) expect(byDate.get(pastMissed)!.state).toBe('missed');
    // A future workout day is just scheduled.
    const future = workoutDates.find((d) => d > '2026-01-05')!;
    expect(byDate.get(future)!.state).toBe('workout');
    expect(byDate.get('2026-01-05')!.isToday).toBe(true);
    expect(plan.days.filter((d) => d.kind === 'rest').every((d) => byDate.get(d.date)!.state === 'rest')).toBe(true);
  });

  it('locates the week containing a date', () => {
    const plan = generatePlan(profile, { startDate: '2026-01-01', seed: 1 });
    const strip = buildStrip(plan, {}, [], '2026-01-01');
    expect(weekIndexOf(strip, '2026-01-01')).toBe(0);
    expect(weekIndexOf(strip, '2026-01-05')).toBe(1);
    expect(weekIndexOf(strip, '2026-01-15')).toBe(2);
  });
});
