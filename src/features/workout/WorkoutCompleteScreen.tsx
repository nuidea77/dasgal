import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { RootScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Card, Overline, Row, Screen, Stat, Title } from '@/components/ui';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';
import { ProgressRing } from '@/components/ProgressRing';
import { AwardMedal } from '@/components/AwardMedal';
import { ExerciseThumb } from '@/components/ExerciseImage';
import { styleFor } from '@/domain/gamification/awards';
import { nextTitle, titleForLevel } from '@/domain/gamification/titles';
import { getExercise } from '@/domain/plan/exercises';
import { XpBar } from '@/components/XpBar';
import { titleName } from '@/features/gamification/titleName';
import { useProgressStore } from '@/store/useProgressStore';
import { format, useT } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';

export function WorkoutCompleteScreen({ route, navigation }: RootScreenProps<'WorkoutComplete'>) {
  const t = useT();
  const { record, outcome, progress } = route.params;
  const xp = useProgressStore((s) => s.xp);
  const fromXp = Math.max(0, xp - outcome.xpGained);
  const next = nextTitle(xp);
  const done = progress.complete;

  useEffect(() => {
    void Haptics.notificationAsync(
      done ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    );
  }, [done]);

  // Awards get their own ceremony, then the rank unlock, then back to the plan.
  const continueFlow = () => {
    if (outcome.newBadges.length > 0) {
      navigation.replace('Award', {
        badgeIds: outcome.newBadges,
        after: outcome.leveledUp ? 'title' : 'home',
        level: outcome.level,
      });
    } else if (outcome.leveledUp) {
      navigation.replace('TitleUnlock', { level: outcome.level });
    } else {
      navigation.popToTop();
    }
  };

  const minutes = Math.floor(record.durationSec / 60);
  const seconds = record.durationSec % 60;
  const percent = Math.round(progress.ratio * 100);

  const breakdown = useMemo(
    () =>
      record.exercises.map((e) => {
        const ex = getExercise(e.exerciseId);
        const timed = ex.countingMode !== 'reps_ai';
        return {
          id: e.exerciseId,
          name: t.exercises[e.exerciseId as keyof typeof t.exercises]?.name ?? e.exerciseId,
          volume: timed
            ? `${e.sets}×${Math.round(e.holdSeconds / Math.max(1, e.sets))}${t.common.seconds}`
            : `${e.sets}×${Math.round(e.reps / Math.max(1, e.sets))}`,
          quality: Math.round(e.quality * 100),
        };
      }),
    [record.exercises, t],
  );

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <View style={styles.hero}>
          <ProgressRing
            ratio={progress.ratio}
            size={150}
            thickness={12}
            value={`${percent}%`}
            label={t.complete.ofPlan}
            from={done ? colors.accent : colors.warning}
            to={done ? colors.primary : colors.danger}
          />
          <Title style={{ textAlign: 'center' }}>{done ? t.complete.title : t.complete.partialTitle}</Title>
          <Body muted style={{ textAlign: 'center' }}>{done ? t.complete.subtitle : t.complete.partialSubtitle}</Body>
        </View>

        {/* XP is the reward, so it leads. */}
        <Card style={{ borderColor: colors.accent }}>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Overline>{t.complete.xpProgress}</Overline>
            <Text style={styles.gain}>+{outcome.xpGained} XP</Text>
          </Row>
          <XpBar fromXp={fromXp} toXp={xp} levelLabel={(level) => titleName(t, titleForLevel(level))} />
          <Caption>{format(t.rank.nextTitle, { title: titleName(t, next.title), xp: next.xpNeeded })}</Caption>
        </Card>

        <Card>
          <Row>
            <Stat label={t.complete.reps} value={`${record.totalReps}`} accent />
            <Stat label={t.complete.time} value={`${minutes}:${String(seconds).padStart(2, '0')}`} />
            <Stat label={t.complete.calories} value={`${record.calories}`} />
            <Stat label={t.progress.streak} value={`${outcome.streakDays}`} />
          </Row>
        </Card>

        <Card>
          <Overline>{t.complete.breakdown}</Overline>
          {breakdown.map((e) => (
            <Row key={e.id} style={{ flexWrap: 'nowrap' }}>
              <ExerciseThumb exerciseId={e.id} size={40} />
              <Body style={{ flex: 1 }} numberOfLines={1}>{e.name}</Body>
              <Text style={styles.volume}>{e.volume}</Text>
              <Text style={[styles.quality, e.quality >= 90 && { color: colors.accent }]}>{e.quality}%</Text>
            </Row>
          ))}
          {breakdown.length === 0 ? <Body muted>{t.complete.nothingDone}</Body> : null}
        </Card>

        {outcome.newBadges.length > 0 ? (
          <Card style={{ borderColor: colors.warning }}>
            <Overline style={{ color: colors.warning }}>{t.complete.newBadge}</Overline>
            {outcome.newBadges.map((id) => {
              const info = t.badges[id as keyof typeof t.badges];
              return (
                <Row key={id} style={{ flexWrap: 'nowrap' }}>
                  <AwardMedal badgeId={id} style={styleFor(id)} size={54} />
                  <View style={{ flex: 1 }}>
                    <Body strong>{info?.name ?? id}</Body>
                    <Body muted>{info?.description}</Body>
                  </View>
                </Row>
              );
            })}
          </Card>
        ) : null}

        {!done ? (
          <Row style={styles.notice}>
            <Icon name="calendar" size={18} color={colors.warning} />
            <Caption style={{ flex: 1, color: colors.textMuted }}>{t.complete.dayStaysOpen}</Caption>
          </Row>
        ) : null}

        <View style={{ flex: 1 }} />
        <Button title={t.complete.continue} size="lg" onPress={continueFlow} />
      </Screen>
      {done ? <Confetti /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  gain: { ...typography.numberLg, color: colors.accent },
  volume: { ...typography.numberSm, color: colors.textMuted },
  quality: { ...typography.numberSm, color: colors.textDim, minWidth: 42, textAlign: 'right' },
  notice: {
    flexWrap: 'nowrap',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
});
