import { MOTIVATION_COUNTS, pickMotivation } from '@/domain/gamification/motivation';
import { mn } from '@/i18n/mn';
import { en } from '@/i18n/en';

const base = { streakDays: 0, workoutsDone: 3, workoutsTotal: 20, restDay: false, doneToday: false, missedDays: 0, kgToGo: 5 };

describe('daily motivation', () => {
  it('picks the tone that fits the day', () => {
    expect(pickMotivation({ ...base, doneToday: true }, '2026-01-01').tone).toBe('done');
    expect(pickMotivation({ ...base, restDay: true }, '2026-01-01').tone).toBe('rest');
    expect(pickMotivation({ ...base, workoutsDone: 0 }, '2026-01-01').tone).toBe('start');
    expect(pickMotivation({ ...base, missedDays: 2 }, '2026-01-01').tone).toBe('comeback');
    expect(pickMotivation({ ...base, workoutsDone: 18 }, '2026-01-01').tone).toBe('final_push');
    expect(pickMotivation({ ...base, streakDays: 5 }, '2026-01-01').tone).toBe('streak');
    expect(pickMotivation(base, '2026-01-01').tone).toBe('daily');
  });
  it('rotates the daily line and stays inside the list', () => {
    const picks = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'].map((d) => pickMotivation(base, d).index);
    expect(new Set(picks).size).toBeGreaterThan(1);
    for (const p of picks) expect(p).toBeLessThan(MOTIVATION_COUNTS.daily);
  });
  it('both dictionaries provide every message', () => {
    for (const [tone, count] of Object.entries(MOTIVATION_COUNTS)) {
      expect(mn.motivation[tone as keyof typeof mn.motivation]).toHaveLength(count);
      expect(en.motivation[tone as keyof typeof en.motivation]).toHaveLength(count);
    }
  });
});
