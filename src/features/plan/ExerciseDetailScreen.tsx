import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RootScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Card, Screen, Subheading, Title } from '@/components/ui';
import { StickFigureDemo } from '@/components/StickFigureDemo';
import { Icon } from '@/components/Icon';
import { ExerciseImage, hasExerciseImage } from '@/components/ExerciseImage';
import { getExercise } from '@/domain/plan/exercises';
import { useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

export function ExerciseDetailScreen({ route, navigation }: RootScreenProps<'ExerciseDetail'>) {
  const t = useT();
  const ex = getExercise(route.params.exerciseId);
  const info = t.exercises[ex.id as keyof typeof t.exercises];
  return (
    <Screen>
      <Title>{info?.name ?? ex.id}</Title>
      {hasExerciseImage(ex.id) ? <ExerciseImage exerciseId={ex.id} style={styles.gif} /> : <StickFigureDemo rest={ex.demo.rest} active={ex.demo.active} size={260} />}
      <StickFigureDemo rest={ex.demo.rest} active={ex.demo.active} size={140} />
      <Card>
        <Subheading>{t.plan.howTo}</Subheading>
        {info?.steps.map((s, i) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNum}>{i + 1}</Text>
            <Body style={{ flex: 1 }}>{s}</Body>
          </View>
        ))}
        {info?.tips ? (
          <View style={styles.step}>
            <Icon name="lightbulb" size={16} color={colors.warning} />
            <Caption style={{ color: colors.warning, flex: 1 }}>{info.tips}</Caption>
          </View>
        ) : null}
      </Card>
      <Card>
        <View style={styles.step}>
          <Icon name="camera" size={16} color={colors.textDim} />
          <Caption style={{ flex: 1 }}>{t.plan[`cameraHint_${ex.cameraHint}` as const]}</Caption>
        </View>
        <View style={styles.step}>
          <Icon name={ex.countingMode === 'timed' ? 'timer' : 'cpu'} size={16} color={colors.textDim} />
          <Caption style={{ flex: 1 }}>{ex.muscles.join(' · ')}</Caption>
          {[1, 2, 3].map((i) => (
            <Icon key={i} name="star" size={12} color={i <= ex.difficulty ? colors.warning : colors.cardBorder} />
          ))}
        </View>
      </Card>
      {route.params.dayIndex !== undefined && route.params.exerciseKey ? (
        <Button
          title={t.plan.swap}
          variant="secondary"
          onPress={() => navigation.navigate('SwapExercise', { dayIndex: route.params.dayIndex!, exerciseKey: route.params.exerciseKey! })}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gif: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.bgElevated },
  step: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  stepNum: { color: colors.accent, fontWeight: '800', width: 20 },
});
