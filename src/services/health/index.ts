import { Platform } from 'react-native';
import { appleHealth } from './appleHealth';
import { healthConnect } from './healthConnect';
import { noopBridge } from './noop';
import { HealthBridge } from './types';

export * from './types';

/**
 * The health store for this platform: Apple Health on iOS, Health Connect on
 * Android, nothing on web.
 *
 * Only aggregate workout data leaves the app — start/end time and calories.
 * Camera frames and pose data never touch this path.
 */
export const health: HealthBridge =
  Platform.OS === 'ios' ? appleHealth : Platform.OS === 'android' ? healthConnect : noopBridge();
