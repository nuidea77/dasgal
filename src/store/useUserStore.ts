import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bmiCategory, BmiCategory, calculateBmi, dailyCalories } from '@/domain/profile/bmi';
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
  /**
   * Stable pseudonymous id, generated once. It identifies this install on the
   * leaderboard; nothing about the person is derivable from it.
   */
  deviceId: string;
  setProfile: (p: UserProfile) => Assessment;
  completeOnboarding: () => void;
  reset: () => void;
}

/** 22 random characters — enough that two installs will not collide. */
function newDeviceId(): string {
  let id = '';
  while (id.length < 22) id += Math.random().toString(36).slice(2);
  return id.slice(0, 22);
}

export function buildAssessment(p: UserProfile): Assessment {
  const bmi = calculateBmi(p.weightKg, p.heightCm);
  return {
    bmi,
    category: bmiCategory(bmi),
    targetWeightKg: p.targetWeightKg,
    calories: dailyCalories(p.weightKg, p.heightCm, p.age, p.sex, p.goal, p.daysPerWeek, p.pace),
  };
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      assessment: null,
      onboarded: false,
      deviceId: newDeviceId(),
      setProfile: (profile) => {
        const assessment = buildAssessment(profile);
        set({ profile, assessment });
        return assessment;
      },
      completeOnboarding: () => set({ onboarded: true }),
      // The id survives a reset so the same install keeps one leaderboard row.
      reset: () => set({ profile: null, assessment: null, onboarded: false }),
    }),
    { name: 'dasgal.user', storage: asyncStorage },
  ),
);
