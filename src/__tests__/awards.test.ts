import { AWARD_STYLES, LOCKED_STYLE, formatAwardDate, sortByEarned, styleFor } from '@/domain/gamification/awards';
import { BADGES } from '@/domain/gamification/badges';

describe('awards', () => {
  it('gives every badge its own enamel colour', () => {
    const accents = BADGES.map((b) => AWARD_STYLES[b.id]?.accent);
    for (const a of accents) expect(a).toMatch(/^#[0-9A-F]{6}$/);
    expect(new Set(accents).size).toBe(BADGES.length);
  });

  it('falls back to the locked style for an unknown badge', () => {
    expect(styleFor('nope')).toBe(LOCKED_STYLE);
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
