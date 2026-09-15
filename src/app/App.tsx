import React, { useCallback, useEffect } from 'react';
import { AppState, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
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
import { colors } from '@/theme';

// Hold the splash until Inter is ready, so no screen renders in the system font first.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

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
        const { profile, deviceId } = useUserStore.getState();
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
  // Oswald for display, Inter for text, JetBrains Mono for figures — bundled as
  // static weights (assets/fonts, SIL OFL) rather than pulled from the
  // @expo-google-fonts packages, which would ship every face of each family.
  const [fontsLoaded, fontError] = useFonts({
    Oswald_500Medium: require('../../assets/fonts/Oswald-Medium.ttf'),
    Oswald_600SemiBold: require('../../assets/fonts/Oswald-SemiBold.ttf'),
    Inter_400Regular: require('../../assets/fonts/Inter-Regular.ttf'),
    Inter_500Medium: require('../../assets/fonts/Inter-Medium.ttf'),
    Inter_600SemiBold: require('../../assets/fonts/Inter-SemiBold.ttf'),
    Inter_700Bold: require('../../assets/fonts/Inter-Bold.ttf'),
    JetBrainsMono_500Medium: require('../../assets/fonts/JetBrainsMono-Medium.ttf'),
    JetBrainsMono_700Bold: require('../../assets/fonts/JetBrainsMono-Bold.ttf'),
  });
  const ready = fontsLoaded || !!fontError;

  const onLayout = useCallback(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={onLayout}>
        <StatusBar style="light" />
        <RootNavigator />
      </View>
    </SafeAreaProvider>
  );
}
