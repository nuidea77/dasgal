import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generatePlan, swapExercise, updateExerciseVolume, WorkoutPlan } from '@/domain/plan/generator';
import { UserProfile } from '@/domain/profile/types';
import { asyncStorage } from '@/services/storage/persist';

interface PlanState {
  plan: WorkoutPlan | null;
  /** date → workout record id */
  completedDates: Record<string, string>;
  generate: (profile: UserProfile, seed?: number) => WorkoutPlan;
  swap: (dayIndex: number, key: string, newExerciseId: string) => void;
  updateVolume: (dayIndex: number, key: string, sets: number, target: number) => void;
  markCompleted: (date: string, recordId: string) => void;
  reset: () => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plan: null,
      completedDates: {},
      generate: (profile, seed) => {
        const plan = generatePlan(profile, { seed: seed ?? Date.now() % 100000 });
        set({ plan, completedDates: {} });
        return plan;
      },
      swap: (dayIndex, key, newExerciseId) => {
        const plan = get().plan;
        if (!plan) return;
        set({ plan: swapExercise(plan, dayIndex, key, newExerciseId) });
      },
      updateVolume: (dayIndex, key, sets, target) => {
        const plan = get().plan;
        if (!plan) return;
        set({ plan: updateExerciseVolume(plan, dayIndex, key, sets, target) });
      },
      markCompleted: (date, recordId) => set({ completedDates: { ...get().completedDates, [date]: recordId } }),
      reset: () => set({ plan: null, completedDates: {} }),
    }),
    { name: 'dasgal.plan', storage: asyncStorage },
  ),
);
