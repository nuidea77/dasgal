import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Icon, IconName } from '@/components/Icon';
import { Sex } from '@/domain/profile/types';
import { useT } from '@/i18n';
import { colors, spacing } from '@/theme';
import { OnboardingStep } from '../OnboardingStep';
import { TOTAL_STEPS } from '../steps';
import { useOnboardingDraft } from '../draft';

const OPTIONS: Array<{ id: Sex; icon: IconName }> = [
  { id: 'male', icon: 'male' },
  { id: 'female', icon: 'female' },
];

export function SexStep({ navigation }: OnboardingScreenProps<'Sex'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  return (
    <OnboardingStep
      title={t.onboarding.sexTitle}
      subtitle={t.onboarding.sexSubtitle}
      step={1}
      total={TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('Age')}
    >
      <View style={styles.wrap}>
        {OPTIONS.map((o) => {
          const on = draft.sex === o.id;
          return (
            <Pressable key={o.id} onPress={() => update({ sex: o.id })} style={styles.item}>
              <View style={[styles.circle, on && { backgroundColor: colors.primary }]}>
                <Icon name={o.icon} size={54} color={on ? colors.white : colors.textMuted} strokeWidth={2} />
              </View>
              <Text style={[styles.label, on && { color: colors.text }]}>{t.onboarding[o.id]}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xl },
  item: { alignItems: 'center', gap: spacing.sm },
  circle: { width: 132, height: 132, borderRadius: 66, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.textMuted, fontSize: 17, fontWeight: '700' },
});
