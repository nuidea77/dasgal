import { Linking } from 'react-native';
import { DailyHealthTotals, HealthBridge, HealthStatus, HealthWorkout, dayBounds } from './types';

/**
 * Apple Health (HealthKit). The native module is required lazily so a build
 * without it — Expo Go, the web preview — degrades to "unavailable" instead of
 * crashing at import time.
 */
type HealthKitModule = typeof import('@kingstinct/react-native-healthkit');

let cached: HealthKitModule | null | undefined;

function hk(): HealthKitModule | null {
  if (cached === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      cached = require('@kingstinct/react-native-healthkit') as HealthKitModule;
    } catch {
      cached = null;
    }
  }
  return cached;
}

/** Written: workouts and the energy they burned. Read: steps and active energy. */
const SHARE = ['HKQuantityTypeIdentifierActiveEnergyBurned', 'HKWorkoutTypeIdentifier'] as const;
const READ = ['HKQuantityTypeIdentifierStepCount', 'HKQuantityTypeIdentifierActiveEnergyBurned'] as const;

/** HKWorkoutActivityTypeFunctionalStrengthTraining — bodyweight circuits. */
const ACTIVITY_FUNCTIONAL_STRENGTH = 20;

export const appleHealth: HealthBridge = {
  id: 'apple',

  async status(): Promise<HealthStatus> {
    const mod = hk();
    if (!mod) return 'unavailable';
    try {
      if (!(await mod.isHealthDataAvailableAsync())) return 'unavailable';
      // HealthKit never reveals read access, so write access stands in for "connected".
      const authorized = mod.authorizationStatusFor('HKWorkoutTypeIdentifier');
      return authorized === 2 ? 'granted' : 'denied';
    } catch {
      return 'unavailable';
    }
  },

  async requestAccess(): Promise<HealthStatus> {
    const mod = hk();
    if (!mod) return 'unavailable';
    try {
      const ok = await mod.requestAuthorization({ toShare: [...SHARE], toRead: [...READ] });
      return ok ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  },

  async writeWorkout(workout: HealthWorkout): Promise<boolean> {
    const mod = hk();
    if (!mod) return false;
    try {
      await mod.saveWorkoutSample(
        ACTIVITY_FUNCTIONAL_STRENGTH,
        [
          {
            quantityType: 'HKQuantityTypeIdentifierActiveEnergyBurned',
            unit: 'kcal',
            quantity: workout.calories,
            startDate: workout.start,
            endDate: workout.end,
          },
        ],
        workout.start,
        workout.end,
        { energyBurned: workout.calories },
      );
      return true;
    } catch {
      return false;
    }
  },

  async readDay(date: Date): Promise<DailyHealthTotals | null> {
    const mod = hk();
    if (!mod) return null;
    const { start, end } = dayBounds(date);
    try {
      const [steps, energy] = await Promise.all([
        mod.queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], {
          filter: { date: { startDate: start, endDate: end } },
          unit: 'count',
        }),
        mod.queryStatisticsForQuantity('HKQuantityTypeIdentifierActiveEnergyBurned', ['cumulativeSum'], {
          filter: { date: { startDate: start, endDate: end } },
          unit: 'kcal',
        }),
      ]);
      return {
        steps: Math.round(steps.sumQuantity?.quantity ?? 0),
        activeCalories: Math.round(energy.sumQuantity?.quantity ?? 0),
      };
    } catch {
      return null;
    }
  },

  async openSettings(): Promise<void> {
    await Linking.openURL('x-apple-health://').catch(() => Linking.openSettings());
  },
};
