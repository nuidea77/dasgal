import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import { useI18nStore } from '@/i18n';
import { scheduleDailyReminder, scheduleMotivation } from '@/services/notifications/scheduler';
import { syncToCloud } from '@/services/cloud/supabase';
import { todayIso } from '@/domain/plan/generator';
import { usePlanStore } from '@/store/usePlanStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUserStore } from '@/store/useUserStore';

/** Keeps the i18n store in sync with the persisted language setting. */
function useLanguageSync() {
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);
  useEffect(() => setLanguage(language), [language, setLanguage]);
}

/** Re-arms notifications and runs an optional cloud sync when the app comes to the foreground. */
function useForegroundTasks() {
  useEffect(() => {
    const run = () => {
      const s = useSettingsStore.getState();
      const completed = new Set(Object.keys(usePlanStore.getState().completedDates));
      if (useUserStore.getState().onboarded) {
        void scheduleDailyReminder(s.reminderEnabled, s.reminderHour, s.reminderMinute);
        void scheduleMotivation(s.motivationEnabled, s.reminderHour, s.reminderMinute, completed);
        // Skipped scheduled days cost XP; the program itself keeps going.
        const plan = usePlanStore.getState().plan;
        if (plan) {
          const scheduled = plan.days.filter((d) => d.kind === 'workout').map((d) => d.date);
          useProgressStore.getState().applyMissedPenalties(scheduled, [...completed], todayIso());
        }
      }
      if (s.cloudSyncEnabled) {
        const profile = useUserStore.getState().profile;
        const deviceId = `${profile?.name ?? 'anon'}-${profile?.age ?? 0}-${profile?.heightCm ?? 0}`;
        void syncToCloud(deviceId, profile, useProgressStore.getState().history);
      }
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, []);
}

export default function App() {
  useLanguageSync();
  useForegroundTasks();
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
