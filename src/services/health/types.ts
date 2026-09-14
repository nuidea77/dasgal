/** One finished Dasgal session, in the shape both health stores understand. */
export interface HealthWorkout {
  start: Date;
  end: Date;
  /** Active energy burned, kcal. */
  calories: number;
  title: string;
}

/** What the OS health store knows about a given day. */
export interface DailyHealthTotals {
  steps: number;
  /** Active energy burned across all apps, kcal. */
  activeCalories: number;
}

export type HealthProviderId = 'apple' | 'google' | 'none';

export type HealthStatus =
  /** No health store on this platform (web, or a build without the native module). */
  | 'unavailable'
  /** Health Connect is not installed / needs an update (Android only). */
  | 'needs_setup'
  /** Available, but the user has not granted access yet. */
  | 'denied'
  | 'granted';

export interface HealthBridge {
  readonly id: HealthProviderId;
  /** Whether this device has a health store Dasgal can talk to. */
  status(): Promise<HealthStatus>;
  /** Shows the OS permission sheet. Resolves to the status afterwards. */
  requestAccess(): Promise<HealthStatus>;
  /** Writes a finished session. Returns false if it was rejected or unavailable. */
  writeWorkout(workout: HealthWorkout): Promise<boolean>;
  /** Steps and active energy for the day containing `date`, or null if unreadable. */
  readDay(date: Date): Promise<DailyHealthTotals | null>;
  /** Opens the OS screen where the user manages this access. */
  openSettings(): Promise<void>;
}

export function dayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}
