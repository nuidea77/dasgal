import { AWARD_METAL, formatAwardDate, metalFor, paletteFor, sortByEarned } from '@/domain/gamification/awards';
import { BADGES } from '@/domain/gamification/badges';

describe('awards', () => {
  it('assigns a metal to every badge', () => {
    for (const b of BADGES) expect(AWARD_METAL[b.id]).toBeDefined();
  });

  it('falls back to bronze for an unknown badge', () => {
    expect(metalFor('nope')).toBe('bronze');
    expect(paletteFor('nope')).toBe(paletteFor('first_workout'));
  });

  it('formats the earned date per language', () => {
    expect(formatAwardDate('2026-09-15', 'en')).toBe('Sep 15, 2026');
    expect(formatAwardDate('2026-09-15', 'mn')).toBe('2026.09.15');
    expect(formatAwardDate('2026-01-02', 'en')).toBe('Jan 2, 2026');
  });

  it('returns an empty string for a missing or malformed date', () => {
    expect(formatAwardDate(undefined, 'en')).toBe('');
    expect(formatAwardDate('tomorrow', 'en')).toBe('');
    expect(formatAwardDate('2026-13-01', 'en')).toBe('');
  });

  it('orders awards by the date they were earned', () => {
    const earned = { a: '2026-02-01', b: '2026-01-01', c: '2026-03-01' };
    expect(sortByEarned(['a', 'b', 'c'], earned)).toEqual(['b', 'a', 'c']);
  });
});
