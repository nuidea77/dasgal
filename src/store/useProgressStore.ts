import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newlyEarnedBadges } from '@/domain/gamification/badges';
import { levelForXp, xpForWorkout } from '@/domain/gamification/levels';
import { computeStreak } from '@/domain/gamification/streak';
import { MISSED_WORKOUT_XP, missedPenaltyDates } from '@/domain/gamification/penalty';
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
  /** Badge id → ISO date it was earned, for the award screen. */
  badgeDates: Record<string, string>;
  history: WorkoutRecord[];
  totalReps: number;
  repsByExercise: Record<string, number>;
  hardWorkouts: number;
  perfectWorkouts: number;
  programsCompleted: number;
  streakDays: number;
  /** Scheduled dates that already cost XP. */
  penalizedDates: string[];
  /** Last penalty applied (for the notice on the plan screen). */
  lastPenalty: { dates: string[]; xpLost: number; at: string } | null;
  /** Deducts XP for skipped scheduled days. Returns how many days were penalised. */
  applyMissedPenalties: (scheduledDates: string[], completedDates: string[], today: string) => { dates: string[]; xpLost: number };
  dismissPenaltyNotice: () => void;
  recordWorkout: (record: Omit<WorkoutRecord, 'xp'>, scheduledDates: string[], programFinished: boolean) => RecordOutcome;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      badges: [],
      badgeDates: {},
      history: [],
      totalReps: 0,
      repsByExercise: {},
      hardWorkouts: 0,
      perfectWorkouts: 0,
      programsCompleted: 0,
      streakDays: 0,
      penalizedDates: [],
      lastPenalty: null,
      applyMissedPenalties: (scheduledDates, completedDates, today) => {
        const s = get();
        const dates = missedPenaltyDates(scheduledDates, completedDates, s.penalizedDates, today);
        if (dates.length === 0) return { dates, xpLost: 0 };
        const xpLost = Math.min(s.xp, dates.length * MISSED_WORKOUT_XP);
        set({
          xp: s.xp - xpLost,
          penalizedDates: [...s.penalizedDates, ...dates],
          lastPenalty: { dates, xpLost, at: today },
          streakDays: computeStreak(s.history.map((h) => h.date), today, scheduledDates),
        });
        return { dates, xpLost };
      },
      dismissPenaltyNotice: () => set({ lastPenalty: null }),
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
        if (xpGained === 0) {
          // Nothing was done: do not record a workout, do not grant badges.
          return { xpGained: 0, newBadges: [], leveledUp: false, level: levelForXp(s.xp), streakDays: s.streakDays };
        }
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
          perfectWorkouts: s.perfectWorkouts + (record.avgQuality >= 0.9 && record.totalReps >= 10 ? 1 : 0),
          programsCompleted: s.programsCompleted + (programFinished ? 1 : 0),
          level,
        };
        const newBadges = newlyEarnedBadges(snapshot, s.badges);
        const badgeDates = { ...s.badgeDates };
        for (const id of newBadges) badgeDates[id] = record.date;
        set({
          xp,
          badges: [...s.badges, ...newBadges],
          badgeDates,
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
        set({ xp: 0, badges: [], badgeDates: {}, history: [], totalReps: 0, repsByExercise: {}, hardWorkouts: 0, perfectWorkouts: 0, programsCompleted: 0, streakDays: 0, penalizedDates: [], lastPenalty: null }),
    }),
    { name: 'dasgal.progress', storage: asyncStorage },
  ),
);
