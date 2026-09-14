/** XP needed to *reach* a given level (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}

export function levelProgress(xp: number): { level: number; current: number; needed: number; ratio: number } {
  const level = levelForXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const current = xp - base;
  const needed = next - base;
  return { level, current, needed, ratio: needed === 0 ? 1 : Math.min(1, current / needed) };
}

export interface WorkoutXpInput {
  reps: number;
  holdSeconds: number;
  minutes: number;
  intensity: 'easy' | 'moderate' | 'hard';
  /** Average rep quality 0..1 */
  quality: number;
  streakDays: number;
}

export function xpForWorkout(input: WorkoutXpInput): number {
  const base = 50;
  const volume = input.reps * 1 + input.holdSeconds * 0.5 + input.minutes * 2;
  const intensityBonus = { easy: 0, moderate: 15, hard: 40 }[input.intensity];
  const qualityBonus = Math.round(volume * Math.max(0, input.quality - 0.7));
  const streakBonus = Math.min(50, input.streakDays * 5);
  return Math.round(base + volume + intensityBonus + qualityBonus + streakBonus);
}
