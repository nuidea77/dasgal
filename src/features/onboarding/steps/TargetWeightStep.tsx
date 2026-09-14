import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { HorizontalWheel } from '@/components/Wheel';
import { Caption } from '@/components/ui';
import { healthyWeightRange } from '@/domain/profile/bmi';
import { kgToLb, lbToKg } from '@/domain/profile/units';
import { format, useT } from '@/i18n';
import { colors, spacing, typography } from '@/theme';
import { OnboardingStep } from '../OnboardingStep';
import { TOTAL_STEPS } from '../steps';
import { useOnboardingDraft } from '../draft';

export function TargetWeightStep({ navigation }: OnboardingScreenProps<'TargetWeight'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  const range = healthyWeightRange(draft.heightCm);
  const imperial = draft.weightUnit === 'lb';
  const delta = Math.round((draft.targetWeightKg - draft.weightKg) * 10) / 10;

  return (
    <OnboardingStep
      title={t.onboarding.targetWeightTitle}
      subtitle={t.onboarding.targetSubtitle}
      step={7}
      total={TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('Pace')}
    >
      <View style={{ gap: spacing.lg }}>
        {imperial ? (
          <HorizontalWheel min={66} max={440} value={kgToLb(draft.targetWeightKg)} onChange={(v) => update({ targetWeightKg: lbToKg(v) })} accent={colors.accent} unit="lb" />
        ) : (
          <HorizontalWheel min={30} max={200} value={Math.round(draft.targetWeightKg)} onChange={(v) => update({ targetWeightKg: v })} accent={colors.accent} unit="kg" />
        )}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={styles.delta}>
            {delta === 0 ? '' : delta > 0 ? `+${delta} ` : `${delta} `}
            {delta === 0 ? t.onboarding.alreadyAtTarget : draft.weightUnit}
          </Text>
          <Caption>{format(t.onboarding.targetWeightHint, { min: range.min, max: range.max, suggested: Math.round(draft.targetWeightKg) })}</Caption>
        </View>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  delta: { ...typography.numberMd, color: colors.accent, fontSize: 18, lineHeight: 22 },
});
