import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { Body, Button, Caption, Card, Row, Screen, Subheading, Title } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { todayIso } from '@/domain/plan/generator';
import { getExercise } from '@/domain/plan/exercises';
import { useT } from '@/i18n';
import { usePlanStore } from '@/store/usePlanStore';
import { useUserStore } from '@/store/useUserStore';
import { colors, radius, spacing } from '@/theme';

export function PlanScreen() {
  const t = useT();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const plan = usePlanStore((s) => s.plan);
  const completed = usePlanStore((s) => s.completedDates);
  const profile = useUserStore((s) => s.profile);
  const generate = usePlanStore((s) => s.generate);
  const today = todayIso();

  const todayDay = useMemo(() => plan?.days.find((d) => d.date === today) ?? plan?.days.find((d) => d.date > today) ?? plan?.days[0], [plan, today]);

  if (!plan || !profile) {
    return (
      <Screen>
        <Title>{t.plan.title}</Title>
        <Body muted>{t.plan.noPlan}</Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{t.plan.title}</Title>
      {todayDay ? (
        <Card style={styles.todayCard}>
          <Caption style={{ color: colors.accent }}>{t.common.today} · {todayDay.date}</Caption>
          <Subheading>{todayDay.kind === 'rest' ? t.plan.restDay : t.plan[`focus_${todayDay.focus}` as const]}</Subheading>
          {todayDay.kind === 'rest' ? (
            <Body muted>{t.plan.restDayHint}</Body>
          ) : (
            <>
              <Body muted>
                {todayDay.exercises.length} {t.common.exercises} · {t.plan.estimated} {todayDay.estimatedMinutes} {t.common.minutes} ·{' '}
                {t.plan[`intensity_${todayDay.intensity}` as const]}
              </Body>
              {completed[todayDay.date] ? (
                <Row>
                  <Icon name="check" color={colors.accent} size={18} />
                  <Body style={{ color: colors.accent, fontWeight: '700' }}>{t.plan.completed}</Body>
                </Row>
              ) : (
                <Button title={t.plan.startWorkout} onPress={() => navigation.navigate('WorkoutSession', { dayIndex: todayDay.dayIndex })} />
              )}
              <Button title={t.plan.edit} variant="ghost" onPress={() => navigation.navigate('DayDetail', { dayIndex: todayDay.dayIndex })} />
            </>
          )}
        </Card>
      ) : null}

      <View style={styles.grid}>
        {plan.days.map((d) => {
          const isToday = d.date === today;
          const done = Boolean(completed[d.date]);
          return (
            <Pressable
              key={d.dayIndex}
              onPress={() => navigation.navigate('DayDetail', { dayIndex: d.dayIndex })}
              style={[styles.cell, d.kind === 'rest' && styles.cellRest, isToday && styles.cellToday, done && styles.cellDone]}
            >
              <Text style={styles.cellDay}>{d.dayIndex + 1}</Text>
              <Icon
                name={done ? 'check' : d.kind === 'rest' ? 'moon' : focusIcon(d.focus)}
                size={18}
                color={done ? colors.accent : d.kind === 'rest' ? colors.textDim : colors.text}
              />
            </Pressable>
          );
        })}
      </View>
      <Caption>
        {plan.days
          .filter((d) => d.kind === 'workout')
          .slice(0, 1)
          .map((d) => d.exercises.map((e) => t.exercises[e.exerciseId as keyof typeof t.exercises]?.name ?? getExercise(e.exerciseId).id).join(', '))}
      </Caption>
      <Button title={t.plan.regenerate} variant="secondary" onPress={() => generate(profile)} />
    </Screen>
  );
}

function focusIcon(focus: string): IconName {
  const map: Record<string, IconName> = { full_body: 'dumbbell', lower: 'legs', upper_core: 'activity', cardio: 'heart' };
  return map[focus] ?? 'dumbbell';
}

const styles = StyleSheet.create({
  todayCard: { borderColor: colors.primary, gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '13%', aspectRatio: 0.85, backgroundColor: colors.card, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder, minWidth: 42 },
  cellRest: { opacity: 0.55 },
  cellToday: { borderColor: colors.accent, borderWidth: 2 },
  cellDone: { backgroundColor: '#163D33', borderColor: colors.accent },
  cellDay: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  cellIcon: {},
});
