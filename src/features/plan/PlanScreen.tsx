import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { Body, Button, Caption, Card, ProgressBar, Row, Screen, Subheading, Title } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ProgressRing } from '@/components/ProgressRing';
import { MotivationBanner } from './MotivationBanner';
import { WeekStrip } from './WeekStrip';
import { useHealthToday } from '@/services/health/useHealthToday';
import { buildStrip } from '@/domain/plan/weekStrip';
import { estimateDayCalories, estimateWeeklyCalories, todayIso } from '@/domain/plan/generator';
import { format, useT } from '@/i18n';
import { usePlanStore } from '@/store/usePlanStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useUserStore } from '@/store/useUserStore';
import { colors, radius, spacing } from '@/theme';

export function PlanScreen() {
  const t = useT();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const plan = usePlanStore((s) => s.plan);
  const completed = usePlanStore((s) => s.completedDates);
  const profile = useUserStore((s) => s.profile);
  const generate = usePlanStore((s) => s.generate);
  const healthToday = useHealthToday();
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
  const strip = useMemo(() => (plan ? buildStrip(plan, completed, penalized, today) : []), [plan, completed, penalized, today]);

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
  const streakDays = useProgressStore.getState().streakDays;

  // Progress toward the target weight: how much of the planned change is already earned
  // (approximated by the share of workouts completed, which is what the app can observe).
  const startWeight = profile.weightKg;
  const targetKg = profile.targetWeightKg;
  const totalChange = Math.abs(targetKg - startWeight);
  const targetRatio = scheduled.length ? doneCount / scheduled.length : 0;
  const kgToGo = Math.round(totalChange * (1 - targetRatio) * 10) / 10;
  const daysLeft = Math.max(0, (plan.days.length - dayNumber) + 1);

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
      <MotivationBanner
        date={today}
        context={{
          streakDays,
          workoutsDone: doneCount,
          workoutsTotal: scheduled.length,
          restDay: todayDay?.kind === 'rest',
          doneToday: Boolean(todayDay && completed[todayDay.date]),
          missedDays: missedSet.size,
          kgToGo,
        }}
      />
      <WeekStrip strip={strip} today={today} onSelect={(dayIndex) => navigation.navigate('DayDetail', { dayIndex })} />
      <Card>
        <Row style={{ flexWrap: 'nowrap', gap: spacing.md }}>
          <ProgressRing
            ratio={targetRatio}
            value={totalChange < 0.1 ? '✓' : `${kgToGo}`}
            label={totalChange < 0.1 ? t.plan.targetReached : t.plan.kgToGoShort}
          />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <View>
              <Caption>{t.plan.toTarget}</Caption>
              <Text style={styles.targetWeight}>{targetKg} кг</Text>
            </View>
            <Row style={{ gap: spacing.md }}>
              <Row style={{ gap: 4 }}>
                <Icon name="flame" size={16} color={streakDays > 0 ? colors.warning : colors.textDim} />
                <Text style={[styles.miniStat, streakDays > 0 && { color: colors.warning }]}>{streakDays}</Text>
              </Row>
              <Row style={{ gap: 4 }}>
                <Icon name="check" size={16} color={colors.accent} />
                <Text style={styles.miniStat}>
                  {doneCount}/{scheduled.length}
                </Text>
              </Row>
              <Row style={{ gap: 4 }}>
                <Icon name="calendar" size={16} color={colors.textDim} />
                <Text style={styles.miniStat}>{format(t.plan.daysLeft, { n: daysLeft })}</Text>
              </Row>
            </Row>
            <ProgressBar ratio={targetRatio} color={colors.accent} />
          </View>
        </Row>
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

      {healthToday ? (
        <Card>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Row>
              <Icon name="heart" color={colors.accent} size={18} />
              <Body muted>{t.plan.healthToday}</Body>
            </Row>
            <Body style={{ fontWeight: '700' }}>
              {format(t.plan.healthTotals, { steps: healthToday.steps, kcal: healthToday.activeCalories })}
            </Body>
          </Row>
        </Card>
      ) : null}

      <Row>
        <Icon name="flame" color={colors.textDim} size={16} />
        <Caption>{format(t.plan.weeklyBurn, { kcal: estimateWeeklyCalories(plan, profile.weightKg) })}</Caption>
      </Row>
      <Button title={t.plan.regenerate} variant="secondary" onPress={() => generate(profile)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  todayCard: { borderColor: colors.primary, gap: spacing.sm },
  targetWeight: { color: colors.text, fontSize: 26, fontWeight: '900' },
  miniStat: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
});
