export type BadgeIcon = 'party' | 'flame' | 'bolt' | 'trophy' | 'legs' | 'dumbbell' | 'hundred' | 'activity' | 'target' | 'graduation' | 'star' | 'award';

export interface BadgeDef {
  id: string;
  /** i18n key suffix: badges.<id>.name/description */
  icon: BadgeIcon;
}

export const BADGES: BadgeDef[] = [
  { id: 'first_workout', icon: 'party' },
  { id: 'streak_3', icon: 'flame' },
  { id: 'streak_7', icon: 'flame' },
  { id: 'streak_14', icon: 'bolt' },
  { id: 'streak_30', icon: 'trophy' },
  { id: 'squats_100', icon: 'legs' },
  { id: 'pushups_100', icon: 'dumbbell' },
  { id: 'reps_1000', icon: 'hundred' },
  { id: 'hard_day', icon: 'activity' },
  { id: 'perfect_form', icon: 'target' },
  { id: 'program_complete', icon: 'graduation' },
  { id: 'level_5', icon: 'star' },
  { id: 'level_10', icon: 'award' },
];

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

/** Returns badge ids earned by the snapshot that are not yet in `owned`. */
export function newlyEarnedBadges(snapshot: ProgressSnapshot, owned: string[]): string[] {
  const has = new Set(owned);
  const earned: string[] = [];
  const grant = (id: string, cond: boolean) => {
    if (cond && !has.has(id)) earned.push(id);
  };
  grant('first_workout', snapshot.workoutsCompleted >= 1);
  grant('streak_3', snapshot.streakDays >= 3);
  grant('streak_7', snapshot.streakDays >= 7);
  grant('streak_14', snapshot.streakDays >= 14);
  grant('streak_30', snapshot.streakDays >= 30);
  grant('squats_100', (snapshot.repsByExercise['squat'] ?? 0) >= 100);
  grant('pushups_100', (snapshot.repsByExercise['pushup'] ?? 0) + (snapshot.repsByExercise['knee_pushup'] ?? 0) >= 100);
  grant('reps_1000', snapshot.totalReps >= 1000);
  grant('hard_day', snapshot.hardWorkouts >= 1);
  grant('perfect_form', snapshot.perfectWorkouts >= 1);
  grant('program_complete', snapshot.programsCompleted >= 1);
  grant('level_5', snapshot.level >= 5);
  grant('level_10', snapshot.level >= 10);
  return earned;
}
