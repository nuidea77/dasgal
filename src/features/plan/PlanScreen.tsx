import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { Body, Button, Caption, Card, ProgressBar, Row, Screen, Subheading, Title } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { estimateDayCalories, estimateWeeklyCalories, todayIso } from '@/domain/plan/generator';
import { format, useT } from '@/i18n';
import { usePlanStore } from '@/store/usePlanStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useUserStore } from '@/store/useUserStore';
import { colors, radius, spacing } from '@/theme';

/** Calendar cells shown around today (the program itself can be many months long). */
const WINDOW_BEFORE = 6;
const WINDOW_AFTER = 14;

export function PlanScreen() {
  const t = useT();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const plan = usePlanStore((s) => s.plan);
  const completed = usePlanStore((s) => s.completedDates);
  const profile = useUserStore((s) => s.profile);
  const generate = usePlanStore((s) => s.generate);
  const applyMissedPenalties = useProgressStore((s) => s.applyMissedPenalties);
  const lastPenalty = useProgressStore((s) => s.lastPenalty);
  const dismissPenaltyNotice = useProgressStore((s) => s.dismissPenaltyNotice);
  const penalized = useProgressStore((s) => s.penalizedDates);
  const today = todayIso();

  const scheduled = useMemo(() => plan?.days.filter((d) => d.kind === 'workout').map((d) => d.date) ?? [], [plan]);
  useEffect(() => {
    if (scheduled.length) applyMissedPenalties(scheduled, Object.keys(completed), today);
  }, [scheduled, completed, today, applyMissedPenalties]);

  const todayDay = useMemo(() => plan?.days.find((d) => d.date === today) ?? plan?.days.find((d) => d.date > today) ?? plan?.days[0], [plan, today]);
  const window = useMemo(() => {
    if (!plan) return [];
    const idx = todayDay?.dayIndex ?? 0;
    return plan.days.slice(Math.max(0, idx - WINDOW_BEFORE), Math.min(plan.days.length, idx + WINDOW_AFTER + 1));
  }, [plan, todayDay]);

  if (!plan || !profile) {
    return (
      <Screen>
        <Title>{t.plan.title}</Title>
        <Body muted>{t.plan.noPlan}</Body>
      </Screen>
    );
  }
  const doneCount = scheduled.filter((d) => completed[d]).length;
  const dayNumber = (todayDay?.dayIndex ?? 0) + 1;
  const missedSet = new Set(penalized);

  return (
    <Screen>
      <Title>{t.plan.title}</Title>
      {lastPenalty ? (
        <Card style={{ borderColor: colors.danger }}>
          <Row>
            <Icon name="bolt" color={colors.danger} size={18} />
            <Subheading>{t.plan.missedTitle}</Subheading>
          </Row>
          <Body muted>{format(t.plan.missedBody, { n: lastPenalty.dates.length, xp: lastPenalty.xpLost })}</Body>
          <Button title={t.plan.dismiss} variant="secondary" onPress={dismissPenaltyNotice} />
        </Card>
      ) : null}
      <Card>
        <Caption>{format(t.plan.progress, { done: doneCount, total: scheduled.length, day: dayNumber })}</Caption>
        <ProgressBar ratio={scheduled.length ? doneCount / scheduled.length : 0} color={colors.accent} />
        <Caption>
          {profile.programDays} {t.common.day.toLowerCase()} · {t.onboarding[`pace_${profile.pace}` as const]} · {plan.days[plan.days.length - 1]?.date}
        </Caption>
      </Card>
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
              <Row>
                <Icon name="flame" color={colors.warning} size={18} />
                <Body style={{ color: colors.warning, fontWeight: '700' }}>{format(t.plan.burnApprox, { kcal: estimateDayCalories(todayDay, profile.weightKg) })}</Body>
              </Row>
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
        {window.map((d) => {
          const isToday = d.date === today;
          const done = Boolean(completed[d.date]);
          const missed = !done && d.kind === 'workout' && missedSet.has(d.date);
          const icon: IconName = done ? 'check' : missed ? 'close' : d.kind === 'rest' ? 'moon' : focusIcon(d.focus);
          const color = done ? colors.accent : missed ? colors.danger : d.kind === 'rest' ? colors.textDim : colors.text;
          return (
            <Pressable
              key={d.dayIndex}
              onPress={() => navigation.navigate('DayDetail', { dayIndex: d.dayIndex })}
              style={[styles.cell, d.kind === 'rest' && styles.cellRest, isToday && styles.cellToday, done && styles.cellDone, missed && styles.cellMissed]}
            >
              <Text style={styles.cellDay}>{d.dayIndex + 1}</Text>
              <Icon name={icon} size={18} color={color} />
            </Pressable>
          );
        })}
      </View>
      <Row>
        <Icon name="flame" color={colors.textDim} size={16} />
        <Caption>{format(t.plan.weeklyBurn, { kcal: estimateWeeklyCalories(plan, profile.weightKg) })}</Caption>
      </Row>
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
  cellMissed: { backgroundColor: '#3A1C28', borderColor: colors.danger },
  cellDay: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
});
