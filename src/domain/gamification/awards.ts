/**
 * Award presentation model: the enamel colour each award is struck in and how
 * its earned date reads in each language. Kept out of the UI so it can be
 * unit-tested and reused by the ceremony screen and the awards grid alike.
 *
 * The colours mirror the artwork in assets/medals — each badge is a silver
 * bezel around a coloured enamel face, and the stage lighting on the award
 * screen is tinted to match.
 */
export interface AwardStyle {
  /** Enamel face colour; drives the stage glow and halo. */
  accent: string;
  /** Lighter tint used for the award name. */
  text: string;
}

export const AWARD_STYLES: Record<string, AwardStyle> = {
  first_workout: { accent: '#FFC531', text: '#FFE39A' },
  streak_3: { accent: '#FF7A2F', text: '#FFC49A' },
  streak_7: { accent: '#FF3D8B', text: '#FFA3C7' },
  streak_14: { accent: '#2F9BFF', text: '#A6D3FF' },
  streak_30: { accent: '#8B5CF6', text: '#C9B4FF' },
  squats_100: { accent: '#14C4A4', text: '#8CEBD9' },
  pushups_100: { accent: '#FF5C5C', text: '#FFAFAF' },
  reps_1000: { accent: '#FFB020', text: '#FFDA96' },
  hard_day: { accent: '#E63950', text: '#FF9FAC' },
  perfect_form: { accent: '#3DDC84', text: '#A5F3C6' },
  program_complete: { accent: '#C94FFF', text: '#E5B4FF' },
  level_5: { accent: '#4DA3FF', text: '#B3D8FF' },
  level_10: { accent: '#A855F7', text: '#DCBBFF' },
};

/** An award that has not been earned yet: no colour, just cold steel. */
export const LOCKED_STYLE: AwardStyle = { accent: '#5A6486', text: '#9AA3C2' };

export function styleFor(badgeId: string): AwardStyle {
  return AWARD_STYLES[badgeId] ?? LOCKED_STYLE;
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

/** Awards are paged through in the order they were earned. */
export function sortByEarned(badgeIds: string[], earnedAt: Record<string, string>): string[] {
  return [...badgeIds].sort((a, b) => (earnedAt[a] ?? '').localeCompare(earnedAt[b] ?? ''));
}
