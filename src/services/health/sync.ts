import { WorkoutRecord } from '@/store/types';
import { health } from './index';

/**
 * Pushes one finished session to the OS health store. Never throws and never
 * blocks the celebration screens — a failed write is simply not synced.
 */
export async function syncWorkout(record: WorkoutRecord, title: string): Promise<boolean> {
  if (record.durationSec <= 0) return false;
  const start = new Date(record.startedAt);
  const end = new Date(record.endedAt);
  try {
    return await health.writeWorkout({ start, end, calories: record.calories, title });
  } catch {
    return false;
  }
}
