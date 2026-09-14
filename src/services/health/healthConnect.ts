import { DailyHealthTotals, HealthBridge, HealthStatus, HealthWorkout, dayBounds } from './types';

/**
 * Android Health Connect. Like the Apple bridge, the native module is required
 * lazily so builds without it simply report "unavailable".
 */
type HealthConnectModule = typeof import('react-native-health-connect');

let cached: HealthConnectModule | null | undefined;
let initialized = false;

function hc(): HealthConnectModule | null {
  if (cached === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      cached = require('react-native-health-connect') as HealthConnectModule;
    } catch {
      cached = null;
    }
  }
  return cached;
}

const PERMISSIONS = [
  { accessType: 'write', recordType: 'ExerciseSession' },
  { accessType: 'write', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
] as const;

/** ExerciseType.CALISTHENICS — bodyweight training. */
const EXERCISE_CALISTHENICS = 13;
const SDK_AVAILABLE = 3;

async function ready(mod: HealthConnectModule): Promise<boolean> {
  if (initialized) return true;
  initialized = await mod.initialize();
  return initialized;
}

function granted(list: readonly { accessType: string; recordType: string }[]): boolean {
  return list.some((p) => p.accessType === 'write' && p.recordType === 'ExerciseSession');
}

export const healthConnect: HealthBridge = {
  id: 'google',

  async status(): Promise<HealthStatus> {
    const mod = hc();
    if (!mod) return 'unavailable';
    try {
      const sdk = await mod.getSdkStatus();
      if (sdk !== SDK_AVAILABLE) return 'needs_setup';
      if (!(await ready(mod))) return 'needs_setup';
      const perms = await mod.getGrantedPermissions();
      return granted(perms as never) ? 'granted' : 'denied';
    } catch {
      return 'unavailable';
    }
  },

  async requestAccess(): Promise<HealthStatus> {
    const mod = hc();
    if (!mod) return 'unavailable';
    try {
      if (!(await ready(mod))) return 'needs_setup';
      const perms = await mod.requestPermission(PERMISSIONS as never);
      return granted(perms as never) ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  },

  async writeWorkout(workout: HealthWorkout): Promise<boolean> {
    const mod = hc();
    if (!mod) return false;
    try {
      if (!(await ready(mod))) return false;
      const startTime = workout.start.toISOString();
      const endTime = workout.end.toISOString();
      await mod.insertRecords([
        {
          recordType: 'ExerciseSession',
          exerciseType: EXERCISE_CALISTHENICS,
          title: workout.title,
          startTime,
          endTime,
        },
        {
          recordType: 'ActiveCaloriesBurned',
          energy: { value: workout.calories, unit: 'kilocalories' },
          startTime,
          endTime,
        },
      ]);
      return true;
    } catch {
      return false;
    }
  },

  async readDay(date: Date): Promise<DailyHealthTotals | null> {
    const mod = hc();
    if (!mod) return null;
    try {
      if (!(await ready(mod))) return null;
      const { start, end } = dayBounds(date);
      const timeRangeFilter = { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() } as const;
      const [steps, energy] = await Promise.all([
        mod.aggregateRecord({ recordType: 'Steps', timeRangeFilter }),
        mod.aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter }),
      ]);
      return {
        steps: Math.round(steps.COUNT_TOTAL ?? 0),
        activeCalories: Math.round((energy.ACTIVE_CALORIES_TOTAL?.inCalories ?? 0) / 1000),
      };
    } catch {
      return null;
    }
  },

  async openSettings(): Promise<void> {
    const mod = hc();
    try {
      mod?.openHealthConnectSettings();
    } catch {
      /* the settings screen is best-effort */
    }
  },
};
