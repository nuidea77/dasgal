/** Visual tier of a rank title, used for medal colours. */
export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'mythic';

export function tierForLevel(level: number): Tier {
  if (level >= 20) return 'mythic';
  if (level >= 15) return 'platinum';
  if (level >= 10) return 'gold';
  if (level >= 5) return 'silver';
  return 'bronze';
}

export const TIER_COLORS: Record<Tier, { from: string; to: string; glow: string; text: string }> = {
  bronze: { from: '#F0A86B', to: '#9C5A2B', glow: 'rgba(240,168,107,0.35)', text: '#F5C08F' },
  silver: { from: '#E8ECF5', to: '#8A93A8', glow: 'rgba(200,210,230,0.35)', text: '#E8ECF5' },
  gold: { from: '#FFE082', to: '#C8901A', glow: 'rgba(255,214,102,0.4)', text: '#FFE082' },
  platinum: { from: '#7DF5D8', to: '#1FA88C', glow: 'rgba(46,230,166,0.4)', text: '#8CF5DC' },
  mythic: { from: '#C9A2FF', to: '#6B3FE0', glow: 'rgba(160,110,255,0.45)', text: '#D3B4FF' },
};
