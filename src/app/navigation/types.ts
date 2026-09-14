import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutRecord } from '@/store/types';
import type { RecordOutcome } from '@/store/useProgressStore';

export type OnboardingStackParamList = {
  Welcome: undefined;
  ProfileForm: undefined;
  Goal: undefined;
  AssessmentResult: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  DayDetail: { dayIndex: number };
  ExerciseDetail: { exerciseId: string; dayIndex?: number; exerciseKey?: string };
  SwapExercise: { dayIndex: number; exerciseKey: string };
  WorkoutSession: { dayIndex: number };
  WorkoutComplete: { record: WorkoutRecord; outcome: RecordOutcome };
};

export type MainTabParamList = {
  Plan: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = NativeStackScreenProps<OnboardingStackParamList, T>;
