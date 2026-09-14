import { nextTitle, titleForLevel, titleForXp, TITLE_KEYS } from '@/domain/gamification/titles';
import { xpForLevel } from '@/domain/gamification/levels';

describe('rank titles', () => {
  it('maps levels to titles and extends past the list with numerals', () => {
    expect(titleForLevel(1)).toEqual({ key: 'initiate', level: 1, suffix: '' });
    expect(titleForLevel(10).key).toBe('warrior');
    expect(titleForLevel(20).key).toBe('eternal_warrior');
    expect(titleForLevel(21)).toEqual({ key: 'eternal_warrior', level: 21, suffix: 'II' });
    expect(titleForLevel(24).suffix).toBe('V');
    expect(new Set(TITLE_KEYS).size).toBe(TITLE_KEYS.length);
  });
  it('derives the current and next title from XP', () => {
    expect(titleForXp(0).key).toBe('initiate');
    expect(titleForXp(xpForLevel(2)).key).toBe('aspirant');
    const n = nextTitle(0);
    expect(n.title.key).toBe('aspirant');
    expect(n.xpNeeded).toBe(100);
  });
});
