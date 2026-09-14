import { create } from 'zustand';
import { FitnessLevel, Goal, Sex, UserProfile } from '@/domain/profile/types';

export interface Draft {
  name: string;
  age: string;
  sex: Sex;
  heightCm: string;
  weightKg: string;
  goal: Goal;
  level: FitnessLevel;
  programDays: number;
  daysPerWeek: number;
}

interface DraftState {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  toProfile: () => UserProfile;
}

/** In-memory onboarding form state (not persisted until the profile is saved). */
export const useOnboardingDraft = create<DraftState>((set, get) => ({
  draft: { name: '', age: '', sex: 'male', heightCm: '', weightKg: '', goal: 'tone', level: 'beginner', programDays: 14, daysPerWeek: 4 },
  update: (patch) => set({ draft: { ...get().draft, ...patch } }),
  toProfile: () => {
    const d = get().draft;
    return {
      name: d.name.trim(),
      age: Number(d.age),
      sex: d.sex,
      heightCm: Number(d.heightCm),
      weightKg: Number(d.weightKg),
      goal: d.goal,
      level: d.level,
      programDays: d.programDays,
      daysPerWeek: d.daysPerWeek,
    };
  },
}));
