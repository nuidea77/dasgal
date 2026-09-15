import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Three faces, each with a job (all loaded in App.tsx, all SIL OFL):
 *
 * - **Oswald** carries display: condensed and athletic, so long Mongolian
 *   headlines fit on one line where a normal-width face would wrap.
 * - **Inter** carries text: everything meant to be read rather than looked at.
 * - **JetBrains Mono** carries figures that sit in rows or tick in place, so
 *   columns line up and a counting number never shifts.
 *
 * Weights are addressed by family name because that is the only thing React
 * Native honours for a bundled font on Android.
 */
export const fonts = {
  display: 'Oswald_600SemiBold',
  displayMedium: 'Oswald_500Medium',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

/** Inter needs the OpenType feature; JetBrains Mono is tabular by construction. */
const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * One type scale for the whole app. Every role carries an explicit line height
 * — with a bundled font, leaving it to the platform gives clipped descenders on
 * Android and inconsistent rhythm between Cyrillic and Latin.
 */
export const typography = {
  /** Celebration headlines: an unlocked rank, an award name. */
  display: { fontFamily: fonts.display, fontSize: 42, lineHeight: 48, letterSpacing: 0.4, color: colors.text } as TextStyle,
  /** Screen titles. */
  h1: { fontFamily: fonts.display, fontSize: 31, lineHeight: 38, letterSpacing: 0.3, color: colors.text } as TextStyle,
  h2: { fontFamily: fonts.display, fontSize: 23, lineHeight: 30, letterSpacing: 0.2, color: colors.text } as TextStyle,
  /** Card and section headings — back to the text face, so cards stay readable. */
  h3: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23, letterSpacing: -0.2, color: colors.text } as TextStyle,
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text } as TextStyle,
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.text } as TextStyle,
  bodyMuted: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted } as TextStyle,
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.textDim } as TextStyle,
  /** Small all-caps labels — Oswald's caps are made for this size. */
  overline: { fontFamily: fonts.display, fontSize: 12, lineHeight: 15, letterSpacing: 1.8, color: colors.textDim, textTransform: 'uppercase' } as TextStyle,
  button: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, letterSpacing: -0.1, color: colors.white } as TextStyle,

  /** Hero figures — the ones being celebrated. Display face, not tabular. */
  numberLg: { fontFamily: fonts.display, fontSize: 36, lineHeight: 42, letterSpacing: 0.3, color: colors.text } as TextStyle,
  /** Figures in a row or a column: mono, so they align and never jump. */
  numberMd: { fontFamily: fonts.monoBold, fontSize: 19, lineHeight: 24, letterSpacing: -0.6, color: colors.text } as TextStyle,
  numberSm: { fontFamily: fonts.mono, fontSize: 13.5, lineHeight: 18, letterSpacing: -0.4, color: colors.text } as TextStyle,
  /** The rep counter over the camera. */
  counter: { fontFamily: fonts.display, fontSize: 104, lineHeight: 108, letterSpacing: 0, color: colors.white } as TextStyle,
};

/** Spread onto any Inter style that shows digits which change in place. */
export const tabular = TABULAR;
