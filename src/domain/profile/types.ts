export type Sex = 'male' | 'female';
export type Goal = 'gain_muscle' | 'lose_weight' | 'tone';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
/** How aggressively the user wants to reach the target weight. */
export type Pace = 'easy' | 'moderate' | 'hard';

export interface UserProfile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  level: FitnessLevel;
  /** Target weight chosen by the user (kg). */
  targetWeightKg: number;
  /** Chosen pace; drives calorie delta, training days per week and progression speed. */
  pace: Pace;
  /** Exercise ids the user wants in their program (the system decides sets/reps). */
  preferredExercises: string[];
  /** Program length in days, derived from the pace timeline (no 30-day cap). */
  programDays: number;
  /** Training days per week, derived from the pace. */
  daysPerWeek: number;
}
