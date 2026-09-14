import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootScreenProps } from '@/app/navigation/types';
import { Body, Caption, Card, Row, Screen, Title } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ExerciseThumb } from '@/components/ExerciseImage';
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
              <Row style={{ flexWrap: 'nowrap' }}>
                <ExerciseThumb exerciseId={id} size={64} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Body style={{ fontWeight: '700' }}>{t.exercises[id as keyof typeof t.exercises]?.name ?? id}</Body>
                  <Row>
                    <Text style={styles.meta}>{cand.muscles.join(' · ')}</Text>
                    <Difficulty level={cand.difficulty} />
                    <Icon name={cand.countingMode === 'timed' ? 'timer' : 'cpu'} size={14} color={colors.textDim} />
                  </Row>
                </View>
              </Row>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

function Difficulty({ level }: { level: number }) {
  return (
    <Row style={{ gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <Icon key={i} name="star" size={12} color={i <= level ? colors.warning : colors.cardBorder} />
      ))}
    </Row>
  );
}

const styles = StyleSheet.create({ meta: { color: colors.textDim, fontSize: 13 } });
