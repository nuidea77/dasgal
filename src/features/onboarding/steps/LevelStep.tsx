import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { FitnessLevel } from '@/domain/profile/types';
import { useT } from '@/i18n';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { OnboardingStep } from '../OnboardingStep';
import { TOTAL_STEPS } from '../steps';
import { useOnboardingDraft } from '../draft';

const LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

export function LevelStep({ navigation }: OnboardingScreenProps<'Level'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  return (
    <OnboardingStep
      title={t.onboarding.levelTitleShort}
      subtitle={t.onboarding.levelSubtitle}
      step={6}
      total={TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('TargetWeight')}
    >
      <View style={{ gap: spacing.sm }}>
        {LEVELS.map((l) => {
          const on = draft.level === l;
          return (
            <Pressable key={l} onPress={() => update({ level: l })} style={[styles.row, on && styles.rowOn]}>
              <Text style={[styles.label, on && { color: colors.white }]}>{t.onboarding[`level_${l}` as const]}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 18, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center' },
  rowOn: { backgroundColor: colors.primary },
  label: { ...typography.h3, color: colors.textMuted, fontFamily: fonts.bold, fontSize: 16 },
});
