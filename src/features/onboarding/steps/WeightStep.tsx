import React from 'react';
import { View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { HorizontalWheel } from '@/components/Wheel';
import { kgToLb, lbToKg, WeightUnit } from '@/domain/profile/units';
import { useT } from '@/i18n';
import { spacing } from '@/theme';
import { OnboardingStep } from '../OnboardingStep';
import { TOTAL_STEPS } from '../steps';
import { UnitToggle } from '../UnitToggle';
import { useOnboardingDraft } from '../draft';

const UNITS: readonly WeightUnit[] = ['kg', 'lb'];

export function WeightStep({ navigation }: OnboardingScreenProps<'Weight'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  const imperial = draft.weightUnit === 'lb';
  return (
    <OnboardingStep
      title={t.onboarding.weightTitle}
      subtitle={t.onboarding.weightSubtitle}
      step={3}
      total={TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('Height')}
    >
      <View style={{ gap: spacing.xl }}>
        <UnitToggle options={UNITS} value={draft.weightUnit} onChange={(u) => update({ weightUnit: u })} />
        {imperial ? (
          <HorizontalWheel min={66} max={440} value={kgToLb(draft.weightKg)} onChange={(v) => update({ weightKg: lbToKg(v) })} unit="lb" />
        ) : (
          <HorizontalWheel min={30} max={200} value={Math.round(draft.weightKg)} onChange={(v) => update({ weightKg: v })} unit="kg" />
        )}
      </View>
    </OnboardingStep>
  );
}
