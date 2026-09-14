/**
 * Award (badge) presentation model: which metal a badge is struck in and how
 * its earned date reads in each language. Kept out of the UI so it can be
 * unit-tested and reused by both the celebration screen and the awards grid.
 */
export type AwardMetal = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface MetalPalette {
  /** Outer rim, darkest. */
  rim: string;
  /** Body gradient, dark → light → dark gives the rounded metal look. */
  dark: string;
  base: string;
  light: string;
  /** Specular highlight. */
  shine: string;
  /** Spotlight colour behind the medal. */
  glow: string;
  /** Text tint for the award name. */
  text: string;
}

export const METALS: Record<AwardMetal, MetalPalette> = {
  bronze: { rim: '#6B3A1B', dark: '#8A4A22', base: '#C2763A', light: '#F0B37E', shine: '#FFE3C7', glow: '#C2763A', text: '#F0B37E' },
  silver: { rim: '#5A6376', dark: '#79839A', base: '#B9C2D4', light: '#E8EDF7', shine: '#FFFFFF', glow: '#A9B4CC', text: '#E8EDF7' },
  gold: { rim: '#7A5310', dark: '#A9781C', base: '#E0A82E', light: '#FFDE8A', shine: '#FFF6D6', glow: '#E0A82E', text: '#FFDE8A' },
  platinum: { rim: '#2C6B63', dark: '#2E8F80', base: '#3FC7AE', light: '#9FF3E2', shine: '#E6FFFA', glow: '#3FC7AE', text: '#9FF3E2' },
};

/** Which metal each badge is struck in — rarer achievements get richer metal. */
export const AWARD_METAL: Record<string, AwardMetal> = {
  first_workout: 'bronze',
  streak_3: 'bronze',
  squats_100: 'bronze',
  pushups_100: 'bronze',
  hard_day: 'silver',
  streak_7: 'silver',
  perfect_form: 'silver',
  level_5: 'silver',
  streak_14: 'gold',
  reps_1000: 'gold',
  level_10: 'gold',
  streak_30: 'platinum',
  program_complete: 'platinum',
};

export function metalFor(badgeId: string): AwardMetal {
  return AWARD_METAL[badgeId] ?? 'bronze';
}

export function paletteFor(badgeId: string): MetalPalette {
  return METALS[metalFor(badgeId)];
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "Sep 15, 2026" in English, "2026.09.15" in Mongolian.
 * `iso` is a YYYY-MM-DD date string; anything unparseable returns ''.
 */
export function formatAwardDate(iso: string | undefined, lang: 'mn' | 'en'): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  const [, y, mo, d] = m;
  const month = Number(mo);
  if (month < 1 || month > 12) return '';
  if (lang === 'en') return `${MONTHS_EN[month - 1]} ${Number(d)}, ${y}`;
  return `${y}.${mo}.${d}`;
}

/** Awards are shown newest-first in the grid but earn-order in the celebration pager. */
export function sortByEarned(badgeIds: string[], earnedAt: Record<string, string>): string[] {
  return [...badgeIds].sort((a, b) => (earnedAt[a] ?? '').localeCompare(earnedAt[b] ?? ''));
}
