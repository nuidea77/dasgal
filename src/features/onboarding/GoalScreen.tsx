import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Button, Chip, Row, Screen, Subheading, Title } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { FitnessLevel, Goal } from '@/domain/profile/types';
import { useT } from '@/i18n';
import { useUserStore } from '@/store/useUserStore';
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
  const { draft, update, toProfile } = useOnboardingDraft();
  const setProfile = useUserStore((s) => s.setProfile);

  const next = () => {
    setProfile(toProfile());
    navigation.navigate('AssessmentResult');
  };

  return (
    <Screen>
      <Title>{t.onboarding.goalTitle}</Title>
      <View style={{ gap: spacing.sm }}>
        {GOALS.map((g) => (
          <Pressable key={g.id} onPress={() => update({ goal: g.id })} style={[styles.goal, draft.goal === g.id && styles.goalSelected]}>
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
      <Subheading>{t.onboarding.programDays}</Subheading>
      <Row>
        {[7, 14, 21, 30].map((d) => (
          <Chip key={d} label={`${d}`} selected={draft.programDays === d} onPress={() => update({ programDays: d })} />
        ))}
      </Row>
      <Subheading>{t.onboarding.daysPerWeek}</Subheading>
      <Row>
        {[3, 4, 5, 6].map((d) => (
          <Chip key={d} label={`${d}`} selected={draft.daysPerWeek === d} onPress={() => update({ daysPerWeek: d })} />
        ))}
      </Row>
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
