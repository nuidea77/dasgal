import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bmiCategory, BmiCategory, calculateBmi, dailyCalories, targetWeight } from '@/domain/profile/bmi';
import { UserProfile } from '@/domain/profile/types';
import { asyncStorage } from '@/services/storage/persist';

export interface Assessment {
  bmi: number;
  category: BmiCategory;
  targetWeightKg: number;
  calories: ReturnType<typeof dailyCalories>;
}

interface UserState {
  profile: UserProfile | null;
  assessment: Assessment | null;
  onboarded: boolean;
  setProfile: (p: UserProfile) => Assessment;
  completeOnboarding: () => void;
  reset: () => void;
}

export function buildAssessment(p: UserProfile): Assessment {
  const bmi = calculateBmi(p.weightKg, p.heightCm);
  return {
    bmi,
    category: bmiCategory(bmi),
    targetWeightKg: targetWeight(p.weightKg, p.heightCm, p.goal),
    calories: dailyCalories(p.weightKg, p.heightCm, p.age, p.sex, p.goal, p.daysPerWeek),
  };
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      assessment: null,
      onboarded: false,
      setProfile: (profile) => {
        const assessment = buildAssessment(profile);
        set({ profile, assessment });
        return assessment;
      },
      completeOnboarding: () => set({ onboarded: true }),
      reset: () => set({ profile: null, assessment: null, onboarded: false }),
    }),
    { name: 'dasgal.user', storage: asyncStorage },
  ),
);
