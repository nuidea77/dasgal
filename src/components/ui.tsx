import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle, ScrollView, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme';

export function Screen({ children, scroll = true, style }: PropsWithChildren<{ scroll?: boolean; style?: StyleProp<ViewStyle> }>) {
  const content = <View style={[styles.screenInner, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[typography.h1, style]}>{children}</Text>;
}
export function Heading({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[typography.h2, style]}>{children}</Text>;
}
export function Subheading({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[typography.h3, style]}>{children}</Text>;
}
export function Body({ children, style, muted, strong, numberOfLines }: PropsWithChildren<{ style?: StyleProp<TextStyle>; muted?: boolean; strong?: boolean; numberOfLines?: number }>) {
  const base = strong ? typography.bodyStrong : muted ? typography.bodyMuted : typography.body;
  return <Text style={[base, style]} numberOfLines={numberOfLines}>{children}</Text>;
}
export function Caption({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[typography.caption, style]}>{children}</Text>;
}
/** Small all-caps label that sits above a section or a hero title. */
export function Overline({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[typography.overline, style]}>{children}</Text>;
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
}

export function Button({ title, onPress, variant = 'primary', disabled, style, size = 'md' }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        size === 'lg' && styles.buttonLg,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'danger' && styles.buttonDanger,
        (disabled || pressed) && { opacity: disabled ? 0.45 : 0.8 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, variant === 'ghost' && { color: colors.primary }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]} accessibilityRole="button" accessibilityState={{ selected }}>
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && { color: colors.accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ ratio, color = colors.primary }: { ratio: number; color?: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  screenInner: { flex: 1, padding: spacing.md, gap: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, gap: spacing.sm },
  button: { paddingVertical: 14, paddingHorizontal: spacing.lg, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  buttonLg: { paddingVertical: 18 },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.cardBorder },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonDanger: { backgroundColor: colors.danger },
  buttonText: { ...typography.button },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.cardBorder },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodyStrong, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { ...typography.numberMd, fontSize: 22, lineHeight: 26 },
  statLabel: { ...typography.caption, fontSize: 12, lineHeight: 15, textAlign: 'center' },
  progressTrack: { height: 10, borderRadius: radius.pill, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill },
});
