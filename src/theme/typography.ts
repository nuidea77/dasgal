import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Inter, loaded in App.tsx. Weights are addressed by family name rather than
 * `fontWeight` because that is the only thing React Native honours for a
 * bundled font on Android.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_900Black',
} as const;

/** Digits that keep their width while a number counts up. */
const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * One type scale for the whole app. Every role carries an explicit line height
 * — with a bundled font, leaving it to the platform gives clipped descenders on
 * Android and inconsistent rhythm between Cyrillic and Latin.
 */
export const typography = {
  /** Celebration headlines: an unlocked rank, an award name. */
  display: { fontFamily: fonts.black, fontSize: 38, lineHeight: 42, letterSpacing: -1.1, color: colors.text } as TextStyle,
  /** Screen titles. */
  h1: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.7, color: colors.text } as TextStyle,
  h2: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 27, letterSpacing: -0.4, color: colors.text } as TextStyle,
  /** Card and section headings. */
  h3: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23, letterSpacing: -0.2, color: colors.text } as TextStyle,
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text } as TextStyle,
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.text } as TextStyle,
  bodyMuted: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted } as TextStyle,
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.textDim } as TextStyle,
  /** Small all-caps labels above a section or a hero title. */
  overline: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 2.2, color: colors.textDim, textTransform: 'uppercase' } as TextStyle,
  button: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, letterSpacing: -0.1, color: colors.white } as TextStyle,
  /** Numeric readouts — always tabular so they do not jitter while counting. */
  numberLg: { fontFamily: fonts.black, fontSize: 34, lineHeight: 38, letterSpacing: -1.2, color: colors.text, ...TABULAR } as TextStyle,
  numberMd: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 24, letterSpacing: -0.6, color: colors.text, ...TABULAR } as TextStyle,
  numberSm: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18, letterSpacing: -0.2, color: colors.text, ...TABULAR } as TextStyle,
  /** The rep counter over the camera. */
  counter: { fontFamily: fonts.black, fontSize: 96, lineHeight: 100, letterSpacing: -4, color: colors.white, ...TABULAR } as TextStyle,
};

/** Spread onto any style that shows digits which change in place. */
export const tabular = TABULAR;
