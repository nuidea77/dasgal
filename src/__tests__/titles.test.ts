import { nextTitle, titleForLevel, titleForXp, TITLE_KEYS } from '@/domain/gamification/titles';
import { xpForLevel } from '@/domain/gamification/levels';

describe('rank titles', () => {
  it('maps levels to titles and extends past the list with numerals', () => {
    expect(titleForLevel(1)).toEqual({ key: 'first_step', level: 1, suffix: '' });
    expect(titleForLevel(10).key).toBe('workout_master');
    expect(titleForLevel(20).key).toBe('mythic_hero');
    expect(titleForLevel(21)).toEqual({ key: 'mythic_hero', level: 21, suffix: 'II' });
    expect(titleForLevel(24).suffix).toBe('V');
    expect(new Set(TITLE_KEYS).size).toBe(TITLE_KEYS.length);
  });
  it('derives the current and next title from XP', () => {
    expect(titleForXp(0).key).toBe('first_step');
    expect(titleForXp(xpForLevel(2)).key).toBe('awakened');
    const n = nextTitle(0);
    expect(n.title.key).toBe('awakened');
    expect(n.xpNeeded).toBe(100);
  });
});
