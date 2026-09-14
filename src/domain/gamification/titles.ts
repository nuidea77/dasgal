import { levelForXp, xpForLevel } from './levels';

/** Motivating rank names, one per level. Levels beyond the list reuse the last title with a numeral. */
export const TITLE_KEYS = [
  'initiate', // 1 Initiate
  'aspirant', // 2 Aspirant
  'consistent', // 3 Consistent
  'challenger', // 4 Challenger
  'resilient', // 5 Resilient
  'disciplined', // 6 The Disciplined
  'relentless', // 7 Relentless
  'iron_will', // 8 Iron Will
  'indomitable', // 9 Indomitable
  'warrior', // 10 Warrior
  'limitless', // 11 Limitless
  'self_conqueror', // 12 Self-Conqueror
  'unshakable', // 13 Unshakable
  'unbreakable', // 14 Unbreakable
  'master', // 15 Master
  'mind_and_body', // 16 Mind & Body
  'invincible', // 17 Invincible
  'absolute', // 18 Absolute
  'living_legend', // 19 Living Legend
  'eternal_warrior', // 20 Eternal Warrior
] as const;

export type TitleKey = (typeof TITLE_KEYS)[number];

export interface RankTitle {
  key: TitleKey;
  level: number;
  /** Roman numeral suffix when the level exceeds the title list (e.g. "Eternal Warrior II"). */
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
