import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { BodyMap } from '@/components/BodyMap';
import { Icon } from '@/components/Icon';
import { BodySide, groupsOnSide } from '@/domain/plan/bodyRegions';
import { exercisesByMuscle, MuscleGroup } from '@/domain/plan/exercises';
import { useT } from '@/i18n';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { OnboardingStep } from '../OnboardingStep';
import { TOTAL_STEPS } from '../steps';
import { useOnboardingDraft } from '../draft';

const SIDES: BodySide[] = ['front', 'back'];

export function TargetMusclesStep({ navigation }: OnboardingScreenProps<'TargetMuscles'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  const [side, setSide] = useState<BodySide>('front');
  const selected = draft.targetMuscles;
  const groups = groupsOnSide(side);

  const toggle = (g: MuscleGroup) => {
    const next = selected.includes(g) ? selected.filter((x) => x !== g) : [...selected, g];
    // The muscle choice seeds the exercise picks; the next step lets the user fine-tune them.
    const exercises = [...new Set(next.flatMap((m) => exercisesByMuscle(m).map((e) => e.id)))];
    update({ targetMuscles: next, preferredExercises: exercises });
  };

  return (
    <OnboardingStep
      title={t.onboarding.musclesTitle}
      subtitle={t.onboarding.musclesSubtitle}
      step={9}
      total={TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('ExercisePick')}
      nextDisabled={selected.length === 0}
    >
      <View style={styles.tabs}>
        {SIDES.map((s) => (
          <Pressable key={s} onPress={() => setSide(s)} style={[styles.tab, side === s && styles.tabOn]}>
            <Text style={[styles.tabText, side === s && styles.tabTextOn]}>{t.onboarding[`side_${s}` as const]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }} showsVerticalScrollIndicator={false}>
          {groups.map((g) => {
            const on = selected.includes(g);
            return (
              <Pressable key={g} onPress={() => toggle(g)} style={[styles.chip, on && styles.chipOn]}>
                <View style={[styles.check, on && styles.checkOn]}>{on ? <Icon name="check" size={11} color={colors.bg} strokeWidth={3.4} /> : null}</View>
                <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>{t.muscles[g]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <BodyMap side={side} selected={selected} width={186} />
      </View>
      <Text style={styles.count}>{selected.length > 0 ? selected.map((g) => t.muscles[g]).join(' · ') : t.onboarding.musclesEmpty}</Text>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', alignSelf: 'center', backgroundColor: colors.card, borderRadius: radius.pill, padding: 4, gap: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: radius.pill },
  tabOn: { backgroundColor: colors.accent },
  tabText: { ...typography.caption, color: colors.textMuted, fontFamily: fonts.bold },
  tabTextOn: { color: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, maxHeight: 420 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.cardBorder, backgroundColor: colors.card },
  chipOn: { borderColor: colors.accent, backgroundColor: '#163D33' },
  chipText: { ...typography.bodyStrong, color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },
  chipTextOn: { color: colors.text },
  check: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.textDim, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  count: { ...typography.caption, fontSize: 12, lineHeight: 16, textAlign: 'center' },
});
