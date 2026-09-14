import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Row, Screen, Subheading, Title } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ExerciseThumb } from '@/components/ExerciseImage';
import { exercisesByMuscle, MUSCLE_GROUPS } from '@/domain/plan/exercises';
import { format, useT } from '@/i18n';
import { usePlanStore } from '@/store/usePlanStore';
import { useUserStore } from '@/store/useUserStore';
import { colors, radius, spacing } from '@/theme';
import { useOnboardingDraft } from './draft';

export const MIN_PICK = 6;

/** A sensible starter set per level, used by the "select recommended" button. */
const RECOMMENDED: Record<string, string[]> = {
  beginner: ['squat', 'knee_pushup', 'glute_bridge', 'plank', 'lunge', 'jumping_jack', 'crunch', 'superman', 'wall_sit', 'bird_dog'],
  intermediate: ['squat', 'pushup', 'lunge', 'plank', 'situp', 'glute_bridge', 'mountain_climber', 'high_knees', 'good_morning', 'side_plank', 'leg_raise', 'reverse_lunge'],
  advanced: ['jump_squat', 'pushup', 'diamond_pushup', 'burpee', 'lunge', 'plank', 'leg_raise', 'pike_pushup', 'skater_jump', 'single_leg_bridge', 'bicycle_crunch', 'plank_jack', 'swimmer'],
};

export function ExercisePickScreen({ navigation }: OnboardingScreenProps<'ExercisePick'>) {
  const t = useT();
  const { draft, update, toggleExercise, toProfile } = useOnboardingDraft();
  const setProfile = useUserStore((s) => s.setProfile);
  const selected = new Set(draft.preferredExercises);
  const enough = selected.size >= MIN_PICK;

  const finish = () => {
    setProfile(toProfile());
    navigation.navigate('AssessmentResult');
  };

  return (
    <Screen>
      <Title>{t.onboarding.pickTitle}</Title>
      <Caption>{t.onboarding.pickSubtitle}</Caption>
      <Row style={{ justifyContent: 'space-between' }}>
        <Body style={{ color: enough ? colors.accent : colors.warning, fontWeight: '700' }}>
          {enough ? format(t.onboarding.pickSelected, { n: selected.size }) : format(t.onboarding.pickMin, { n: MIN_PICK })}
        </Body>
        <Row>
          <Pressable onPress={() => update({ preferredExercises: RECOMMENDED[draft.level] ?? [] })}>
            <Text style={styles.link}>{t.onboarding.pickRecommended}</Text>
          </Pressable>
          <Pressable onPress={() => update({ preferredExercises: [] })}>
            <Text style={[styles.link, { color: colors.textDim }]}>{t.onboarding.pickClear}</Text>
          </Pressable>
        </Row>
      </Row>
      {MUSCLE_GROUPS.map((group) => (
        <View key={group} style={{ gap: spacing.sm }}>
          <Subheading>{t.muscles[group]}</Subheading>
          <View style={styles.grid}>
            {exercisesByMuscle(group).map((ex) => {
              const on = selected.has(ex.id);
              return (
                <Pressable key={`${group}-${ex.id}`} onPress={() => toggleExercise(ex.id)} style={[styles.cell, on && styles.cellOn]}>
                  <ExerciseThumb exerciseId={ex.id} size={64} />
                  <Text style={styles.cellName} numberOfLines={2}>{t.exercises[ex.id as keyof typeof t.exercises]?.name ?? ex.id}</Text>
                  <View style={[styles.check, on && styles.checkOn]}>{on ? <Icon name="check" size={14} color={colors.bg} strokeWidth={3} /> : null}</View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <Button title={t.common.next} size="lg" disabled={!enough} onPress={finish} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.primary, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { width: '30.5%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 6, gap: 4, borderWidth: 2, borderColor: colors.cardBorder, alignItems: 'center' },
  cellOn: { borderColor: colors.accent, backgroundColor: '#163D33' },
  cellName: { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center', minHeight: 32 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
