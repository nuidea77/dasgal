import { levelForXp, xpForLevel } from './levels';

/** Motivating rank names, one per level. Levels beyond the list reuse the last title with a numeral. */
export const TITLE_KEYS = [
  'first_step', // 1
  'awakened', // 2
  'go_getter', // 3
  'steady', // 4
  'strong_one', // 5
  'fire_heart', // 6
  'iron_will', // 7
  'wind_speed', // 8
  'steel_muscle', // 9
  'workout_master', // 10
  'barrier_breaker', // 11
  'relentless', // 12
  'champion', // 13
  'mountain_wolf', // 14
  'legend', // 15
  'storm', // 16
  'titan', // 17
  'eternal_form', // 18
  'grandmaster', // 19
  'mythic_hero', // 20
] as const;

export type TitleKey = (typeof TITLE_KEYS)[number];

export interface RankTitle {
  key: TitleKey;
  level: number;
  /** Roman numeral suffix when the level exceeds the title list (e.g. "Mythic Hero II"). */
  suffix: string;
}

function roman(n: number): string {
  const map: Array<[number, string]> = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  let v = n;
  for (const [num, sym] of map) {
    while (v >= num) {
      out += sym;
      v -= num;
    }
  }
  return out;
}

export function titleForLevel(level: number): RankTitle {
  const idx = Math.max(1, level) - 1;
  if (idx < TITLE_KEYS.length) return { key: TITLE_KEYS[idx]!, level, suffix: '' };
  const extra = idx - TITLE_KEYS.length + 2; // first repeat is "II"
  return { key: TITLE_KEYS[TITLE_KEYS.length - 1]!, level, suffix: roman(extra) };
}

export function titleForXp(xp: number): RankTitle {
  return titleForLevel(levelForXp(xp));
}

/** The next title and how much XP is still needed to reach it. */
export function nextTitle(xp: number): { title: RankTitle; xpNeeded: number } {
  const level = levelForXp(xp);
  return { title: titleForLevel(level + 1), xpNeeded: xpForLevel(level + 1) - xp };
}
