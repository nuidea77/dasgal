import { estimateTargetTimeline, paceOptions } from '@/domain/profile/timeline';
import { missedPenaltyDates } from '@/domain/gamification/penalty';

describe('target weight timeline', () => {
  it('gives three paces, faster paces take fewer weeks', () => {
    const [easy, moderate, hard] = paceOptions(82, 73.8, 'lose_weight', 120, '2026-01-01');
    expect(easy!.weeks).toBeGreaterThan(moderate!.weeks);
    expect(moderate!.weeks).toBeGreaterThanOrEqual(hard!.weeks);
    expect(easy!.daysPerWeek).toBe(3);
    expect(hard!.daysPerWeek).toBe(5);
    expect(hard!.calorieDelta).toBe(-600);
    expect(hard!.programDays).toBe(hard!.weeks * 7);
    expect(hard!.programDays).toBeGreaterThan(30);
  });
  it('respects the safe loss ceiling per pace', () => {
    const hard = estimateTargetTimeline(100, 80, 'lose_weight', 'hard', 200, '2026-01-01');
    expect(Math.abs(hard.weeklyRateKg)).toBeLessThanOrEqual(1.0);
    const easy = estimateTargetTimeline(100, 80, 'lose_weight', 'easy', 200, '2026-01-01');
    expect(Math.abs(easy.weeklyRateKg)).toBeLessThanOrEqual(0.5);
  });
  it('caps lean gain and never exceeds a year', () => {
    const t = estimateTargetTimeline(60, 70, 'gain_muscle', 'hard', 150, '2026-01-01');
    expect(t.weeklyRateKg).toBeLessThanOrEqual(0.5);
    expect(t.programDays).toBeLessThanOrEqual(365);
  });
  it('returns a maintenance block when already at target', () => {
    const t = estimateTargetTimeline(70, 70, 'tone', 'moderate', 100, '2026-01-01');
    expect(t.weeks).toBe(0);
    expect(t.programDays).toBe(28);
  });
});

describe('missed workout penalty', () => {
  it('lists past scheduled days that were skipped and not yet penalised', () => {
    const scheduled = ['2026-01-01', '2026-01-03', '2026-01-05', '2026-01-07'];
    expect(missedPenaltyDates(scheduled, ['2026-01-01'], [], '2026-01-06')).toEqual(['2026-01-03', '2026-01-05']);
    expect(missedPenaltyDates(scheduled, ['2026-01-01'], ['2026-01-03'], '2026-01-06')).toEqual(['2026-01-05']);
    // Today is never penalised yet.
    expect(missedPenaltyDates(scheduled, [], [], '2026-01-01')).toEqual([]);
  });
});
