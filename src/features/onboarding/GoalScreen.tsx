import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Chip, Row, Screen, Subheading, Title } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { WheelPicker } from '@/components/WheelPicker';
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
  const weight = draft.weightKg;
  const height = draft.heightCm;
  const range = healthyWeightRange(height);
  const suggested = targetWeight(weight, height, draft.goal);

  // Move the target to the suggestion whenever the goal changes, so the picker opens on it.
  useEffect(() => {
    update({ targetWeightKg: suggested });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.goal]);

  const next = () => {
    const target = draft.targetWeightKg;
    if (!(target >= 30 && target <= 250)) {
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
          <Pressable key={g.id} onPress={() => update({ goal: g.id, targetWeightKg: targetWeight(weight, height, g.id) })} style={[styles.goal, draft.goal === g.id && styles.goalSelected]}>
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
      <WheelPicker
        min={Math.max(30, Math.round(weight * 0.6))}
        max={Math.min(250, Math.round(weight * 1.4))}
        step={0.5}
        decimals={1}
        value={draft.targetWeightKg}
        onChange={(v) => update({ targetWeightKg: v })}
        unit="кг"
        markerValue={Math.round(weight)}
        markerLabel={t.onboarding.nowMarker}
        hint={format(t.onboarding.targetWeightHint, { min: range.min, max: range.max, suggested })}
      />
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

});
