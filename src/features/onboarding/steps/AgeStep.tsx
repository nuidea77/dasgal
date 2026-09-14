import React from 'react';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { VerticalWheel } from '@/components/Wheel';
import { useT } from '@/i18n';
import { OnboardingStep } from '../OnboardingStep';
import { TOTAL_STEPS } from '../steps';
import { useOnboardingDraft } from '../draft';

export function AgeStep({ navigation }: OnboardingScreenProps<'Age'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  return (
    <OnboardingStep
      title={t.onboarding.ageTitle}
      subtitle={t.onboarding.ageSubtitle}
      step={2}
      total={TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('Weight')}
    >
      <VerticalWheel min={12} max={90} value={draft.age} onChange={(v) => update({ age: v })} />
    </OnboardingStep>
  );
}
