import { create } from 'zustand';
import { FitnessLevel, Goal, Pace, Sex, UserProfile } from '@/domain/profile/types';
import { HeightUnit, WeightUnit } from '@/domain/profile/units';

export interface Draft {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  level: FitnessLevel;
  targetWeightKg: number;
  pace: Pace;
  preferredExercises: string[];
  programDays: number;
  daysPerWeek: number;
  /** Display units; the profile itself always stores cm/kg. */
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
}

interface DraftState {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  toggleExercise: (id: string) => void;
  toProfile: () => UserProfile;
}

/** In-memory onboarding form state (not persisted until the profile is saved). */
export const useOnboardingDraft = create<DraftState>((set, get) => ({
  // Pickers open on these averages, so nothing starts blank.
  draft: {
    name: '', age: 28, sex: 'male', heightCm: 170, weightKg: 70, goal: 'tone', level: 'beginner',
    targetWeightKg: 70, pace: 'moderate', preferredExercises: [], programDays: 28, daysPerWeek: 4,
    heightUnit: 'cm', weightUnit: 'kg',
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
      age: d.age,
      sex: d.sex,
      heightCm: d.heightCm,
      weightKg: d.weightKg,
      goal: d.goal,
      level: d.level,
      targetWeightKg: d.targetWeightKg,
      pace: d.pace,
      preferredExercises: d.preferredExercises,
      programDays: d.programDays,
      daysPerWeek: d.daysPerWeek,
    };
  },
}));
