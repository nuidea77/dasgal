import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/i18n';
import { asyncStorage } from '@/services/storage/persist';

interface SettingsState {
  language: Language;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  motivationEnabled: boolean;
  voiceEnabled: boolean;
  cameraPosition: 'front' | 'back';
  showSkeleton: boolean;
  cloudSyncEnabled: boolean;
  update: (patch: Partial<Omit<SettingsState, 'update'>>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'mn',
      reminderEnabled: true,
      reminderHour: 19,
      reminderMinute: 0,
      motivationEnabled: true,
      voiceEnabled: true,
      cameraPosition: 'front',
      showSkeleton: true,
      cloudSyncEnabled: false,
      update: (patch) => set(patch),
    }),
    { name: 'dasgal.settings', storage: asyncStorage },
  ),
);
