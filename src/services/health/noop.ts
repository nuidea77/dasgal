import { HealthBridge, HealthProviderId } from './types';

/** Used on web and on builds without the native health modules. */
export function noopBridge(id: HealthProviderId = 'none'): HealthBridge {
  return {
    id,
    status: async () => 'unavailable',
    requestAccess: async () => 'unavailable',
    writeWorkout: async () => false,
    readDay: async () => null,
    openSettings: async () => undefined,
  };
}
