import React from 'react';
import { View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { VerticalWheel } from '@/components/Wheel';
import { cmToInches, HeightUnit, inchesToCm } from '@/domain/profile/units';
import { useT } from '@/i18n';
import { spacing } from '@/theme';
import { OnboardingStep } from '../OnboardingStep';
import { TOTAL_STEPS } from '../steps';
import { UnitToggle } from '../UnitToggle';
import { useOnboardingDraft } from '../draft';

const UNITS: readonly HeightUnit[] = ['cm', 'ft'];

export function HeightStep({ navigation }: OnboardingScreenProps<'Height'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  const imperial = draft.heightUnit === 'ft';
  return (
    <OnboardingStep
      title={t.onboarding.heightTitle}
      subtitle={t.onboarding.heightSubtitle}
      step={4}
      total={TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('Goal')}
    >
      <View style={{ gap: spacing.lg }}>
        <UnitToggle options={UNITS} value={draft.heightUnit} onChange={(u) => update({ heightUnit: u })} />
        {imperial ? (
          <VerticalWheel
            min={47}
            max={87}
            value={cmToInches(draft.heightCm)}
            onChange={(v) => update({ heightCm: inchesToCm(v) })}
            format={(inches) => `${Math.floor(inches / 12)}'${inches % 12}"`}
          />
        ) : (
          <VerticalWheel min={120} max={220} value={Math.round(draft.heightCm)} onChange={(v) => update({ heightCm: v })} />
        )}
      </View>
    </OnboardingStep>
  );
}
