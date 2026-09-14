import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutRecord } from '@/store/types';
import type { RecordOutcome } from '@/store/useProgressStore';
import type { SessionProgress } from '@/domain/workout/completion';

export type OnboardingStackParamList = {
  Welcome: undefined;
  Sex: undefined;
  Age: undefined;
  Weight: undefined;
  Height: undefined;
  Goal: undefined;
  Level: undefined;
  TargetWeight: undefined;
  Pace: undefined;
  TargetMuscles: undefined;
  ExercisePick: undefined;
  Profile: undefined;
  AssessmentResult: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  DayDetail: { dayIndex: number };
  ExerciseDetail: { exerciseId: string; dayIndex?: number; exerciseKey?: string };
  SwapExercise: { dayIndex: number; exerciseKey: string };
  WorkoutSession: { dayIndex: number };
  WorkoutComplete: { record: WorkoutRecord; outcome: RecordOutcome; progress: SessionProgress };
  TitleUnlock: { level: number };
  Award: { badgeIds: string[]; index?: number; after?: 'title' | 'home' | 'back'; level?: number };
  Leaderboard: undefined;
};

export type MainTabParamList = {
  Plan: undefined;
  Library: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = NativeStackScreenProps<OnboardingStackParamList, T>;
