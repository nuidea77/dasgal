export type BadgeIcon = 'party' | 'flame' | 'bolt' | 'trophy' | 'legs' | 'dumbbell' | 'hundred' | 'activity' | 'target' | 'graduation' | 'star' | 'award';

/** How the awards page groups badges: the shelf each one sits on. */
export type BadgeGroup = 'milestone' | 'streak' | 'volume' | 'mastery';

export interface BadgeDef {
  id: string;
  /** i18n key suffix: badges.<id>.name/description */
  icon: BadgeIcon;
  group: BadgeGroup;
}

export const BADGES: BadgeDef[] = [
  { id: 'first_workout', icon: 'party', group: 'milestone' },
  { id: 'streak_3', icon: 'flame', group: 'streak' },
  { id: 'streak_7', icon: 'flame', group: 'streak' },
  { id: 'streak_14', icon: 'bolt', group: 'streak' },
  { id: 'streak_30', icon: 'trophy', group: 'streak' },
  { id: 'squats_100', icon: 'legs', group: 'volume' },
  { id: 'pushups_100', icon: 'dumbbell', group: 'volume' },
  { id: 'reps_1000', icon: 'hundred', group: 'volume' },
  { id: 'hard_day', icon: 'activity', group: 'mastery' },
  { id: 'perfect_form', icon: 'target', group: 'mastery' },
  { id: 'program_complete', icon: 'graduation', group: 'mastery' },
  { id: 'level_5', icon: 'star', group: 'milestone' },
  { id: 'level_10', icon: 'award', group: 'milestone' },
];

/** Shelf order on the awards page. */
export const BADGE_GROUPS: BadgeGroup[] = ['milestone', 'streak', 'volume', 'mastery'];

export interface ProgressSnapshot {
  workoutsCompleted: number;
  streakDays: number;
  totalReps: number;
  repsByExercise: Record<string, number>;
  hardWorkouts: number;
  perfectWorkouts: number;
  programsCompleted: number;
  level: number;
}

/** Where the user stands against a badge's requirement: 5 of 7 days, 430 of 1000 reps. */
export interface BadgeProgress {
  current: number;
  target: number;
  /** current / target, clamped to [0, 1]. */
  ratio: number;
}

const pushups = (s: ProgressSnapshot) => (s.repsByExercise['pushup'] ?? 0) + (s.repsByExercise['knee_pushup'] ?? 0);

/**
 * Each badge's requirement as a counter, so the UI can show how close a locked
 * one is. `floor` is where the counter starts: levels begin at 1, so a new
 * user is 0% of the way to level 5, not 20%.
 */
const REQUIREMENTS: Record<string, { target: number; floor?: number; current: (s: ProgressSnapshot) => number }> = {
  first_workout: { target: 1, current: (s) => s.workoutsCompleted },
  streak_3: { target: 3, current: (s) => s.streakDays },
  streak_7: { target: 7, current: (s) => s.streakDays },
  streak_14: { target: 14, current: (s) => s.streakDays },
  streak_30: { target: 30, current: (s) => s.streakDays },
  squats_100: { target: 100, current: (s) => s.repsByExercise['squat'] ?? 0 },
  pushups_100: { target: 100, current: pushups },
  reps_1000: { target: 1000, current: (s) => s.totalReps },
  hard_day: { target: 1, current: (s) => s.hardWorkouts },
  perfect_form: { target: 1, current: (s) => s.perfectWorkouts },
  program_complete: { target: 1, current: (s) => s.programsCompleted },
  level_5: { target: 5, floor: 1, current: (s) => s.level },
  level_10: { target: 10, floor: 1, current: (s) => s.level },
};

export function badgeProgress(badgeId: string, snapshot: ProgressSnapshot): BadgeProgress {
  const req = REQUIREMENTS[badgeId];
  if (!req) return { current: 0, target: 1, ratio: 0 };
  const floor = req.floor ?? 0;
  const current = Math.max(floor, Math.min(req.target, Math.floor(req.current(snapshot))));
  return { current, target: req.target, ratio: (current - floor) / (req.target - floor) };
}

/**
 * The locked badge the user is closest to earning — what the awards page puts
 * in the "next up" slot. Ties go to the smaller requirement, so a 3-day streak
 * is suggested before a 30-day one. Undefined once everything is earned.
 */
export function nextBadge(snapshot: ProgressSnapshot, owned: string[]): { id: string; progress: BadgeProgress } | undefined {
  const has = new Set(owned);
  let best: { id: string; progress: BadgeProgress } | undefined;
  for (const b of BADGES) {
    if (has.has(b.id)) continue;
    const progress = badgeProgress(b.id, snapshot);
    if (!best || progress.ratio > best.progress.ratio || (progress.ratio === best.progress.ratio && progress.target < best.progress.target)) {
      best = { id: b.id, progress };
    }
  }
  return best;
}

/** Returns badge ids earned by the snapshot that are not yet in `owned`. */
export function newlyEarnedBadges(snapshot: ProgressSnapshot, owned: string[]): string[] {
  const has = new Set(owned);
  return BADGES.filter((b) => !has.has(b.id) && badgeProgress(b.id, snapshot).ratio >= 1).map((b) => b.id);
}
