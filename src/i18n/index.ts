import { create } from 'zustand';
import { en } from './en';
import { mn, Translations } from './mn';

export type Language = 'mn' | 'en';

const DICTS: Record<Language, Translations> = { mn, en };

interface I18nState {
  language: Language;
  setLanguage: (l: Language) => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  language: 'mn',
  setLanguage: (language) => set({ language }),
}));

export function dict(language: Language = useI18nStore.getState().language): Translations {
  return DICTS[language];
}

/** Hook returning the active dictionary. */
export function useT(): Translations {
  const language = useI18nStore((s) => s.language);
  return DICTS[language];
}

export function format(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''));
}

/** Speech-synthesis locale for the language. */
export function speechLocale(language: Language): string {
  return language === 'mn' ? 'mn-MN' : 'en-US';
}
