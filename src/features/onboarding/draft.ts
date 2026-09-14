import { create } from 'zustand';
import { FitnessLevel, Goal, Pace, Sex, UserProfile } from '@/domain/profile/types';

export interface Draft {
  name: string;
  age: string;
  sex: Sex;
  heightCm: string;
  weightKg: string;
  goal: Goal;
  level: FitnessLevel;
  targetWeightKg: string;
  pace: Pace;
  preferredExercises: string[];
  programDays: number;
  daysPerWeek: number;
}

interface DraftState {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  toggleExercise: (id: string) => void;
  toProfile: () => UserProfile;
}

/** In-memory onboarding form state (not persisted until the profile is saved). */
export const useOnboardingDraft = create<DraftState>((set, get) => ({
  draft: {
    name: '', age: '', sex: 'male', heightCm: '', weightKg: '', goal: 'tone', level: 'beginner',
    targetWeightKg: '', pace: 'moderate', preferredExercises: [], programDays: 28, daysPerWeek: 4,
  },
  update: (patch) => set({ draft: { ...get().draft, ...patch } }),
  toggleExercise: (id) => {
    const d = get().draft;
    const has = d.preferredExercises.includes(id);
    set({ draft: { ...d, preferredExercises: has ? d.preferredExercises.filter((x) => x !== id) : [...d.preferredExercises, id] } });
  },
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
      targetWeightKg: Number(d.targetWeightKg),
      pace: d.pace,
      preferredExercises: d.preferredExercises,
      programDays: d.programDays,
      daysPerWeek: d.daysPerWeek,
    };
  },
}));
