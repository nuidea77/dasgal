import { estimateTargetTimeline } from '@/domain/profile/timeline';

describe('target weight timeline', () => {
  it('estimates weeks to lose weight within the safe rate', () => {
    // 82 → 73.8 kg, 450 kcal/day deficit + ~800 kcal/week of workouts.
    const t = estimateTargetTimeline(82, 73.8, 'lose_weight', -450, 800, '2026-01-01');
    expect(t.deltaKg).toBeCloseTo(-8.2);
    expect(t.weeklyRateKg).toBeLessThan(0);
    expect(Math.abs(t.weeklyRateKg)).toBeLessThanOrEqual(0.82);
    expect(t.weeks).toBeGreaterThanOrEqual(10);
    expect(t.targetDate > '2026-01-01').toBe(true);
    expect(t.suggestedProgramDays).toBe(30);
    expect(t.cycles).toBeGreaterThanOrEqual(3);
  });
  it('caps lean gain at 0.5 kg per week', () => {
    const t = estimateTargetTimeline(60, 64, 'gain_muscle', 300, 500, '2026-01-01');
    expect(t.weeklyRateKg).toBeLessThanOrEqual(0.5);
    expect(t.weeks).toBeGreaterThanOrEqual(8);
  });
  it('returns zero when already at target', () => {
    const t = estimateTargetTimeline(70, 70, 'tone', 0, 0, '2026-01-01');
    expect(t.weeks).toBe(0);
    expect(t.targetDate).toBe('2026-01-01');
  });
  it('suggests a short first cycle for a small goal', () => {
    const t = estimateTargetTimeline(66, 65.5, 'tone', -200, 400, '2026-01-01');
    expect(t.suggestedProgramDays).toBeLessThanOrEqual(21);
    expect(t.cycles).toBe(1);
  });
});
