import React from 'react';
import { Icon } from '@/components/Icon';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useT } from '@/i18n';
import { useUserStore } from '@/store/useUserStore';
import { colors } from '@/theme';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';
import { ProfileFormScreen } from '@/features/onboarding/ProfileFormScreen';
import { GoalScreen } from '@/features/onboarding/GoalScreen';
import { AssessmentResultScreen } from '@/features/onboarding/AssessmentResultScreen';
import { PlanScreen } from '@/features/plan/PlanScreen';
import { DayDetailScreen } from '@/features/plan/DayDetailScreen';
import { ExerciseDetailScreen } from '@/features/plan/ExerciseDetailScreen';
import { SwapExerciseScreen } from '@/features/plan/SwapExerciseScreen';
import { WorkoutSessionScreen } from '@/features/workout/WorkoutSessionScreen';
import { WorkoutCompleteScreen } from '@/features/workout/WorkoutCompleteScreen';
import { ProgressScreen } from '@/features/progress/ProgressScreen';
import { LibraryScreen } from '@/features/library/LibraryScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { MainTabParamList, OnboardingStackParamList, RootStackParamList } from './types';

const Onboarding = createNativeStackNavigator<OnboardingStackParamList>();
const Root = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bgElevated, primary: colors.primary, text: colors.text, border: colors.cardBorder },
};

function MainTabs() {
  const t = useT();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.cardBorder },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
      }}
    >
      <Tabs.Screen name="Plan" component={PlanScreen} options={{ title: t.tabs.plan, tabBarIcon: ({ color }) => <Icon name="calendar" color={color} /> }} />
      <Tabs.Screen name="Library" component={LibraryScreen} options={{ title: t.tabs.library, tabBarIcon: ({ color }) => <Icon name="dumbbell" color={color} /> }} />
      <Tabs.Screen name="Progress" component={ProgressScreen} options={{ title: t.tabs.progress, tabBarIcon: ({ color }) => <Icon name="trophy" color={color} /> }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: t.tabs.settings, tabBarIcon: ({ color }) => <Icon name="settings" color={color} /> }} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const onboarded = useUserStore((s) => s.onboarded);
  const t = useT();
  return (
    <NavigationContainer theme={theme}>
      {onboarded ? (
        <Root.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerShadowVisible: false }}>
          <Root.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Root.Screen name="DayDetail" component={DayDetailScreen} options={{ title: '' }} />
          <Root.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: '' }} />
          <Root.Screen name="SwapExercise" component={SwapExerciseScreen} options={{ title: t.plan.swap, presentation: 'modal' }} />
          <Root.Screen name="WorkoutSession" component={WorkoutSessionScreen} options={{ headerShown: false, gestureEnabled: false, orientation: 'portrait' }} />
          <Root.Screen name="WorkoutComplete" component={WorkoutCompleteScreen} options={{ headerShown: false, gestureEnabled: false }} />
        </Root.Navigator>
      ) : (
        <Onboarding.Navigator screenOptions={{ headerShown: false }}>
          <Onboarding.Screen name="Welcome" component={WelcomeScreen} />
          <Onboarding.Screen name="ProfileForm" component={ProfileFormScreen} />
          <Onboarding.Screen name="Goal" component={GoalScreen} />
          <Onboarding.Screen name="AssessmentResult" component={AssessmentResultScreen} />
        </Onboarding.Navigator>
      )}
    </NavigationContainer>
  );
}
