export interface BadgeDef {
  id: string;
  /** i18n key suffix: badges.<id>.name/description */
  icon: string;
}

export const BADGES: BadgeDef[] = [
  { id: 'first_workout', icon: '🎉' },
  { id: 'streak_3', icon: '🔥' },
  { id: 'streak_7', icon: '🔥' },
  { id: 'streak_14', icon: '⚡' },
  { id: 'streak_30', icon: '🏆' },
  { id: 'squats_100', icon: '🦵' },
  { id: 'pushups_100', icon: '💪' },
  { id: 'reps_1000', icon: '💯' },
  { id: 'hard_day', icon: '🥵' },
  { id: 'perfect_form', icon: '🎯' },
  { id: 'program_complete', icon: '🎓' },
  { id: 'level_5', icon: '⭐' },
  { id: 'level_10', icon: '🌟' },
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
