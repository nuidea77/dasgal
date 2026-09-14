import { RankTitle } from '@/domain/gamification/titles';
import type { Translations } from '@/i18n/mn';

/** Localised display name for a rank title, e.g. "Домгийн баатар II". */
export function titleName(t: Translations, title: RankTitle): string {
  const base = t.titles[title.key];
  return title.suffix ? `${base} ${title.suffix}` : base;
}
