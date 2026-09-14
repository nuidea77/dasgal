import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newlyEarnedBadges } from '@/domain/gamification/badges';
import { levelForXp, xpForWorkout } from '@/domain/gamification/levels';
import { computeStreak } from '@/domain/gamification/streak';
import { asyncStorage } from '@/services/storage/persist';
import { WorkoutRecord } from './types';

export interface RecordOutcome {
  xpGained: number;
  newBadges: string[];
  leveledUp: boolean;
  level: number;
  streakDays: number;
}

interface ProgressState {
  xp: number;
  badges: string[];
  history: WorkoutRecord[];
  totalReps: number;
  repsByExercise: Record<string, number>;
  hardWorkouts: number;
  perfectWorkouts: number;
  programsCompleted: number;
  streakDays: number;
  recordWorkout: (record: Omit<WorkoutRecord, 'xp'>, scheduledDates: string[], programFinished: boolean) => RecordOutcome;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      badges: [],
      history: [],
      totalReps: 0,
      repsByExercise: {},
      hardWorkouts: 0,
      perfectWorkouts: 0,
      programsCompleted: 0,
      streakDays: 0,
      recordWorkout: (record, scheduledDates, programFinished) => {
        const s = get();
        const dates = [...s.history.map((h) => h.date), record.date];
        const streakDays = computeStreak(dates, record.date, scheduledDates);
        const xpGained = xpForWorkout({
          reps: record.totalReps,
          holdSeconds: record.totalHoldSeconds,
          minutes: record.durationSec / 60,
          intensity: record.intensity,
          quality: record.avgQuality,
          streakDays,
        });
        const prevLevel = levelForXp(s.xp);
        const xp = s.xp + xpGained;
        const level = levelForXp(xp);
        const repsByExercise = { ...s.repsByExercise };
        for (const e of record.exercises) repsByExercise[e.exerciseId] = (repsByExercise[e.exerciseId] ?? 0) + e.reps;
        const snapshot = {
          workoutsCompleted: s.history.length + 1,
          streakDays,
          totalReps: s.totalReps + record.totalReps,
          repsByExercise,
          hardWorkouts: s.hardWorkouts + (record.intensity === 'hard' ? 1 : 0),
          perfectWorkouts: s.perfectWorkouts + (record.avgQuality >= 0.9 ? 1 : 0),
          programsCompleted: s.programsCompleted + (programFinished ? 1 : 0),
          level,
        };
        const newBadges = newlyEarnedBadges(snapshot, s.badges);
        set({
          xp,
          badges: [...s.badges, ...newBadges],
          history: [...s.history, { ...record, xp: xpGained }],
          totalReps: snapshot.totalReps,
          repsByExercise,
          hardWorkouts: snapshot.hardWorkouts,
          perfectWorkouts: snapshot.perfectWorkouts,
          programsCompleted: snapshot.programsCompleted,
          streakDays,
        });
        return { xpGained, newBadges, leveledUp: level > prevLevel, level, streakDays };
      },
      reset: () =>
        set({ xp: 0, badges: [], history: [], totalReps: 0, repsByExercise: {}, hardWorkouts: 0, perfectWorkouts: 0, programsCompleted: 0, streakDays: 0 }),
    }),
    { name: 'dasgal.progress', storage: asyncStorage },
  ),
);
