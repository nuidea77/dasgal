export interface ExerciseRecord {
  exerciseId: string;
  sets: number;
  reps: number;
  holdSeconds: number;
  /** Mean quality 0..1 of AI-counted reps (1 for timed exercises). */
  quality: number;
}

export interface WorkoutRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayIndex: number;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  exercises: ExerciseRecord[];
  totalReps: number;
  totalHoldSeconds: number;
  calories: number;
  avgQuality: number;
  intensity: 'easy' | 'moderate' | 'hard';
  xp: number;
}
