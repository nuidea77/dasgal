import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { RootScreenProps } from '@/app/navigation/types';
import { Body, Caption, Card, Screen, Title } from '@/components/ui';
import { EXERCISES, getExercise } from '@/domain/plan/exercises';
import { useT } from '@/i18n';
import { usePlanStore } from '@/store/usePlanStore';
import { colors } from '@/theme';

export function SwapExerciseScreen({ route, navigation }: RootScreenProps<'SwapExercise'>) {
  const t = useT();
  const plan = usePlanStore((s) => s.plan);
  const swap = usePlanStore((s) => s.swap);
  const day = plan?.days.find((d) => d.dayIndex === route.params.dayIndex);
  const current = day?.exercises.find((e) => e.key === route.params.exerciseKey);
  if (!day || !current) return null;
  const ex = getExercise(current.exerciseId);
  const usedIds = new Set(day.exercises.map((e) => e.exerciseId));
  // Preferred alternatives first, then everything else sharing a muscle group.
  const candidates = [
    ...ex.alternatives,
    ...Object.keys(EXERCISES).filter((id) => id !== ex.id && !ex.alternatives.includes(id) && EXERCISES[id]!.muscles.some((m) => ex.muscles.includes(m))),
  ].filter((id) => !usedIds.has(id));

  return (
    <Screen>
      <Title>{t.plan.alternatives}</Title>
      <Caption>{t.exercises[ex.id as keyof typeof t.exercises]?.name}</Caption>
      {candidates.map((id) => {
        const cand = getExercise(id);
        return (
          <Pressable
            key={id}
            onPress={() => {
              swap(day.dayIndex, current.key, id);
              navigation.goBack();
            }}
          >
            <Card>
              <Body style={{ fontWeight: '700' }}>{t.exercises[id as keyof typeof t.exercises]?.name ?? id}</Body>
              <Text style={styles.meta}>
                {cand.muscles.join(' · ')} · {'★'.repeat(cand.difficulty)} · {cand.countingMode === 'timed' ? '⏱' : '🤖 AI'}
              </Text>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({ meta: { color: colors.textDim, fontSize: 13 } });
