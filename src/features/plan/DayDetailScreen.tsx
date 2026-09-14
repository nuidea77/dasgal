import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Card, Row, Screen, Title } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ExerciseThumb } from '@/components/ExerciseImage';
import { getExercise } from '@/domain/plan/exercises';
import { estimateDayCalories, estimateExerciseCalories } from '@/domain/plan/generator';
import { format } from '@/i18n';
import { useUserStore } from '@/store/useUserStore';
import { useT } from '@/i18n';
import { usePlanStore } from '@/store/usePlanStore';
import { colors, spacing, typography } from '@/theme';

export function DayDetailScreen({ route, navigation }: RootScreenProps<'DayDetail'>) {
  const t = useT();
  const plan = usePlanStore((s) => s.plan);
  const completed = usePlanStore((s) => s.completedDates);
  const updateVolume = usePlanStore((s) => s.updateVolume);
  const weightKg = useUserStore((s) => s.profile?.weightKg ?? 70);
  const day = plan?.days.find((d) => d.dayIndex === route.params.dayIndex);
  if (!day) return null;

  const adjust = (key: string, sets: number, target: number) => updateVolume(day.dayIndex, key, sets, target);

  return (
    <Screen>
      <Title>
        {t.common.day} {day.dayIndex + 1}
      </Title>
      <Caption>
        {day.date} · {day.kind === 'rest' ? t.plan.restDay : `${t.plan[`focus_${day.focus}` as const]} · ${t.plan[`intensity_${day.intensity}` as const]} · ${day.estimatedMinutes} ${t.common.minutes}`}
      </Caption>
      {day.kind === 'rest' ? (
        <Body muted>{t.plan.restDayHint}</Body>
      ) : (
        <>
          <Row>
            <Icon name="flame" color={colors.warning} size={18} />
            <Body strong style={{ color: colors.warning }}>
              {t.plan.burn}: {format(t.plan.burnApprox, { kcal: estimateDayCalories(day, weightKg) })}
            </Body>
          </Row>
          {day.exercises.map((pe) => {
            const ex = getExercise(pe.exerciseId);
            const name = t.exercises[pe.exerciseId as keyof typeof t.exercises]?.name ?? pe.exerciseId;
            const unit = ex.countingMode === 'reps_ai' ? t.common.reps : t.common.seconds;
            return (
              <Card key={pe.key}>
                <Pressable onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: pe.exerciseId, dayIndex: day.dayIndex, exerciseKey: pe.key })}>
                  <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                    <ExerciseThumb exerciseId={ex.id} size={56} />
                    <View style={{ flex: 1 }}>
                      <Body strong>{name}</Body>
                      <Caption>{format(t.plan.burnApprox, { kcal: estimateExerciseCalories(pe, weightKg) })}</Caption>
                    </View>
                    <Icon name={ex.countingMode === 'timed' ? 'timer' : 'cpu'} size={18} color={colors.textDim} />
                  </Row>
                </Pressable>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Caption>{t.plan.setsReps}</Caption>
                  <Row>
                    <Stepper value={pe.sets} onChange={(v) => adjust(pe.key, v, pe.target)} suffix={t.common.sets} />
                    <Stepper value={pe.target} step={ex.countingMode === 'reps_ai' ? 1 : 5} onChange={(v) => adjust(pe.key, pe.sets, v)} suffix={unit} />
                  </Row>
                </Row>
                <Button title={t.plan.swap} variant="secondary" onPress={() => navigation.navigate('SwapExercise', { dayIndex: day.dayIndex, exerciseKey: pe.key })} />
              </Card>
            );
          })}
          {completed[day.date] ? (
            <Row style={{ justifyContent: 'center' }}>
              <Icon name="check" color={colors.accent} size={18} />
              <Body strong style={{ color: colors.accent }}>{t.plan.completed}</Body>
            </Row>
          ) : (
            <Button title={t.plan.startWorkout} size="lg" onPress={() => navigation.navigate('WorkoutSession', { dayIndex: day.dayIndex })} />
          )}
        </>
      )}
    </Screen>
  );
}

function Stepper({ value, onChange, step = 1, suffix }: { value: number; onChange: (v: number) => void; step?: number; suffix: string }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(Math.max(1, value - step))} style={styles.stepBtn} hitSlop={8}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>
        {value} {suffix}
      </Text>
      <Pressable onPress={() => onChange(value + step)} style={styles.stepBtn} hitSlop={8}>
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.bgElevated, borderRadius: 999, paddingHorizontal: 4 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepText: { ...typography.numberMd, color: colors.primary },
  stepValue: { ...typography.numberSm, fontSize: 15, lineHeight: 20, minWidth: 60, textAlign: 'center' },
});
