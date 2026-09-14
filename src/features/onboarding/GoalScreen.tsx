import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Chip, Row, Screen, Subheading, Title } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { healthyWeightRange, targetWeight } from '@/domain/profile/bmi';
import { FitnessLevel, Goal } from '@/domain/profile/types';
import { format, useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import { useOnboardingDraft } from './draft';

const GOALS: Array<{ id: Goal; icon: IconName }> = [
  { id: 'gain_muscle', icon: 'dumbbell' },
  { id: 'lose_weight', icon: 'flame' },
  { id: 'tone', icon: 'sparkles' },
];
const LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

export function GoalScreen({ navigation }: OnboardingScreenProps<'Goal'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  const [error, setError] = useState<string | null>(null);
  const weight = Number(draft.weightKg);
  const height = Number(draft.heightCm);
  const range = healthyWeightRange(height);
  const suggested = targetWeight(weight, height, draft.goal);

  // Pre-fill the target with the suggestion for the chosen goal (until the user edits it).
  useEffect(() => {
    if (!draft.targetWeightKg) update({ targetWeightKg: String(suggested) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.goal]);

  const next = () => {
    const target = Number(draft.targetWeightKg);
    if (!(target >= weight * 0.6 && target <= weight * 1.4) || !(target >= 30 && target <= 250)) {
      setError(t.onboarding.validation);
      return;
    }
    setError(null);
    navigation.navigate('Pace');
  };

  return (
    <Screen>
      <Title>{t.onboarding.goalTitle}</Title>
      <View style={{ gap: spacing.sm }}>
        {GOALS.map((g) => (
          <Pressable key={g.id} onPress={() => update({ goal: g.id, targetWeightKg: String(targetWeight(weight, height, g.id)) })} style={[styles.goal, draft.goal === g.id && styles.goalSelected]}>
            <View style={styles.goalIcon}>
              <Icon name={g.icon} size={24} color={draft.goal === g.id ? colors.primary : colors.textMuted} />
            </View>
            <Text style={styles.goalText}>{t.onboarding[`goal_${g.id}` as const]}</Text>
          </Pressable>
        ))}
      </View>
      <Subheading>{t.onboarding.levelTitle}</Subheading>
      <Row>
        {LEVELS.map((l) => (
          <Chip key={l} label={t.onboarding[`level_${l}` as const]} selected={draft.level === l} onPress={() => update({ level: l })} />
        ))}
      </Row>
      <Subheading>{t.onboarding.targetWeightTitle}</Subheading>
      <TextInput
        value={draft.targetWeightKg}
        onChangeText={(v) => update({ targetWeightKg: v })}
        keyboardType="numeric"
        style={styles.input}
        placeholder={t.onboarding.targetWeightInput}
        placeholderTextColor={colors.textDim}
      />
      <Caption>{format(t.onboarding.targetWeightHint, { min: range.min, max: range.max, suggested })}</Caption>
      {error ? <Body style={{ color: colors.danger }}>{error}</Body> : null}
      <View style={{ flex: 1 }} />
      <Button title={t.common.next} size="lg" onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  goal: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, padding: spacing.md, borderRadius: radius.md, borderWidth: 2, borderColor: colors.cardBorder },
  goalSelected: { borderColor: colors.primary, backgroundColor: '#251F4D' },
  goalIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  goalText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  input: { backgroundColor: colors.bgElevated, color: colors.text, borderRadius: radius.sm, padding: spacing.md, fontSize: 22, fontWeight: '700', borderWidth: 1, borderColor: colors.cardBorder },
});
