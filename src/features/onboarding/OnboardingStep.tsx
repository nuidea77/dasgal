import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body } from '@/components/ui';
import { useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  /** 1-based position in the onboarding flow, for the progress dots. */
  step: number;
  total: number;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

/** One question per screen: title, helper text, the control, then Back / Continue. */
export function OnboardingStep({ title, subtitle, step, total, onBack, onNext, nextLabel, nextDisabled, children }: PropsWithChildren<Props>) {
  const t = useT();
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Body muted style={styles.subtitle}>{subtitle}</Body> : null}
      </View>
      <View style={styles.body}>{children}</View>
      <View style={styles.dots}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.dot, i === step - 1 && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.footer}>
        {onBack ? (
          <Pressable onPress={onBack} style={({ pressed }) => [styles.btn, styles.btnBack, pressed && { opacity: 0.8 }]}>
            <Text style={styles.btnBackText}>{t.common.back}</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onNext}
          disabled={nextDisabled}
          style={({ pressed }) => [styles.btn, styles.btnNext, nextDisabled && { opacity: 0.4 }, pressed && !nextDisabled && { opacity: 0.85 }]}
        >
          <Text style={styles.btnNextText}>{nextLabel ?? t.common.next}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  head: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.xl },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center', fontSize: 14, lineHeight: 19, paddingHorizontal: spacing.md },
  body: { flex: 1, justifyContent: 'center', gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cardBorder },
  dotActive: { width: 20, backgroundColor: colors.primary },
  footer: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.md },
  btn: { flex: 1, paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnBack: { backgroundColor: colors.card, maxWidth: '38%' },
  btnBackText: { color: colors.textMuted, fontSize: 16, fontWeight: '700' },
  btnNext: { backgroundColor: colors.primary },
  btnNextText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
