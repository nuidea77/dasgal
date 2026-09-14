import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Icon, IconName } from '@/components/Icon';
import { targetWeight } from '@/domain/profile/bmi';
import { Goal } from '@/domain/profile/types';
import { useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import { OnboardingStep } from '../OnboardingStep';
import { TOTAL_STEPS } from '../steps';
import { useOnboardingDraft } from '../draft';

const GOALS: Array<{ id: Goal; icon: IconName }> = [
  { id: 'gain_muscle', icon: 'dumbbell' },
  { id: 'lose_weight', icon: 'flame' },
  { id: 'tone', icon: 'sparkles' },
];

export function GoalStep({ navigation }: OnboardingScreenProps<'Goal'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  return (
    <OnboardingStep
      title={t.onboarding.goalTitle}
      subtitle={t.onboarding.goalSubtitle}
      step={5}
      total={TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('Level')}
    >
      <View style={{ gap: spacing.sm }}>
        {GOALS.map((g) => {
          const on = draft.goal === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => update({ goal: g.id, targetWeightKg: targetWeight(draft.weightKg, draft.heightCm, g.id) })}
              style={[styles.row, on && styles.rowOn]}
            >
              <View style={[styles.icon, on && { backgroundColor: colors.primary }]}>
                <Icon name={g.icon} size={20} color={on ? colors.white : colors.textMuted} />
              </View>
              <Text style={[styles.label, on && { color: colors.text }]}>{t.onboarding[`goal_${g.id}` as const]}</Text>
              <View style={[styles.check, on && styles.checkOn]}>{on ? <Icon name="check" size={13} color={colors.white} strokeWidth={3} /> : null}</View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.cardBorder },
  rowOn: { borderColor: colors.primary, backgroundColor: '#251F4D' },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, color: colors.textMuted, fontSize: 16, fontWeight: '700' },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
