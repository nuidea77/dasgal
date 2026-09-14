import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n';
import { useUserStore } from '@/store/useUserStore';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { OnboardingStep } from '../OnboardingStep';
import { TOTAL_STEPS } from '../steps';
import { useOnboardingDraft } from '../draft';

/** Last onboarding step: the name, then the assessment is computed. */
export function ProfileStep({ navigation }: OnboardingScreenProps<'Profile'>) {
  const t = useT();
  const { draft, update, toProfile } = useOnboardingDraft();
  const setProfile = useUserStore((s) => s.setProfile);
  const [error, setError] = useState<string | null>(null);

  const finish = () => {
    if (!draft.name.trim()) {
      setError(t.onboarding.validation);
      return;
    }
    setProfile(toProfile());
    navigation.navigate('AssessmentResult');
  };

  return (
    <OnboardingStep
      title={t.onboarding.profileTitle}
      subtitle={t.onboarding.profileSubtitle}
      step={11}
      total={TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      onNext={finish}
      nextLabel={t.common.start}
      nextDisabled={!draft.name.trim()}
    >
      <View style={{ gap: spacing.lg, alignItems: 'center' }}>
        <View style={styles.avatar}>
          <Icon name="user" size={52} color={colors.textDim} />
        </View>
        <View style={{ alignSelf: 'stretch', gap: 6 }}>
          <Text style={styles.label}>{t.onboarding.name}</Text>
          <TextInput
            value={draft.name}
            onChangeText={(v) => update({ name: v })}
            style={styles.input}
            placeholder={t.onboarding.namePlaceholder}
            placeholderTextColor={colors.textDim}
            autoFocus
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 108, height: 108, borderRadius: 54, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.caption, color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 },
  input: { backgroundColor: colors.bgElevated, color: colors.text, borderRadius: radius.sm, padding: spacing.md, ...typography.body, fontSize: 17, borderWidth: 1, borderColor: colors.cardBorder },
  error: { color: colors.danger },
});
