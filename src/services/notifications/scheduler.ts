import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { dict } from '@/i18n';

const REMINDER_ID_KEY = 'daily-reminder';
const MOTIVATION_ID_KEY = 'motivation';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('workout-reminders', {
      name: 'Workout reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C5CFF',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function cancelByIdentifier(prefix: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all.filter((n) => n.identifier.startsWith(prefix)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Schedules (or clears) the daily workout reminder at HH:mm local time. */
export async function scheduleDailyReminder(enabled: boolean, hour: number, minute: number): Promise<void> {
  await cancelByIdentifier(REMINDER_ID_KEY);
  if (!enabled) return;
  if (!(await ensureNotificationPermission())) return;
  const t = dict().notifications;
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID_KEY,
    content: { title: t.reminderTitle, body: t.reminderBody, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'workout-reminders' },
  });
}

/**
 * Motivational nudges: scheduled for the next 7 days at reminderTime + 3h.
 * Call `clearMotivationForToday` when the user completes the workout so that day's nudge is dropped.
 * Re-run on app foreground to roll the window forward.
 */
export async function scheduleMotivation(enabled: boolean, hour: number, minute: number, completedDates: Set<string>): Promise<void> {
  await cancelByIdentifier(MOTIVATION_ID_KEY);
  if (!enabled) return;
  if (!(await ensureNotificationPermission())) return;
  const t = dict().notifications;
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const fire = new Date(now);
    fire.setDate(now.getDate() + i);
    fire.setHours(hour + 3, minute, 0, 0);
    if (fire.getTime() <= now.getTime()) continue;
    const iso = `${fire.getFullYear()}-${String(fire.getMonth() + 1).padStart(2, '0')}-${String(fire.getDate()).padStart(2, '0')}`;
    if (completedDates.has(iso)) continue;
    const quote = t.quotes[(fire.getDate() + i) % t.quotes.length] ?? t.quotes[0]!;
    await Notifications.scheduleNotificationAsync({
      identifier: `${MOTIVATION_ID_KEY}-${iso}`,
      content: { title: t.missedTitle, body: quote, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire, channelId: 'workout-reminders' },
    });
  }
}

export async function clearMotivationForToday(dateIso: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`${MOTIVATION_ID_KEY}-${dateIso}`).catch(() => undefined);
}
