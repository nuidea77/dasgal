import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { RootScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Card, Screen, Subheading, Title } from '@/components/ui';
import { StickFigureDemo } from '@/components/StickFigureDemo';
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
      {ex.gifUrl ? (
        <Image source={{ uri: ex.gifUrl }} style={styles.gif} contentFit="cover" />
      ) : (
        <StickFigureDemo rest={ex.demo.rest} active={ex.demo.active} size={260} />
      )}
      <Card>
        <Subheading>{t.plan.howTo}</Subheading>
        {info?.steps.map((s, i) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNum}>{i + 1}</Text>
            <Body style={{ flex: 1 }}>{s}</Body>
          </View>
        ))}
        {info?.tips ? <Caption style={{ color: colors.warning }}>💡 {info.tips}</Caption> : null}
      </Card>
      <Card>
        <Caption>📱 {t.plan[`cameraHint_${ex.cameraHint}` as const]}</Caption>
        <Caption>
          {ex.countingMode === 'timed' ? '⏱ ' : '🤖 '}
          {ex.muscles.join(' · ')} · {'★'.repeat(ex.difficulty)}
        </Caption>
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
  gif: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, backgroundColor: colors.bgElevated },
  step: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepNum: { color: colors.accent, fontWeight: '800', width: 20 },
});
