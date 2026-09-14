export const colors = {
  bg: '#0B1020',
  bgElevated: '#141B2E',
  card: '#1B2440',
  cardBorder: '#26314F',
  primary: '#7C5CFF',
  primaryDark: '#5B3FE0',
  accent: '#2EE6A6',
  warning: '#FFB84D',
  danger: '#FF5C7A',
  text: '#F4F6FF',
  textMuted: '#9AA3C2',
  textDim: '#6B7394',
  overlay: 'rgba(11,16,32,0.72)',
  skeleton: '#2EE6A6',
  skeletonBad: '#FF5C7A',
  white: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const typography = {
  h1: { fontSize: 32, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  bodyMuted: { fontSize: 15, color: colors.textMuted },
  caption: { fontSize: 13, color: colors.textDim },
  counter: { fontSize: 96, fontWeight: '900' as const, color: colors.white },
};
