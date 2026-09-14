export type Sex = 'male' | 'female';
export type Goal = 'gain_muscle' | 'lose_weight' | 'tone';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  level: FitnessLevel;
  /** Desired program length in days (7..30). */
  programDays: number;
  /** Days per week the user wants to train (3..6). */
  daysPerWeek: number;
}
