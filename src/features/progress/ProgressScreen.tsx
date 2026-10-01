import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { Body, Caption, Card, ProgressBar, Row, Screen, Stat, Subheading, Title } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { AwardMedal } from '@/components/AwardMedal';
import { BADGES, nextBadge } from '@/domain/gamification/badges';
import { sortByEarned, styleFor } from '@/domain/gamification/awards';
import { workoutsSince, xpSince } from '@/domain/gamification/leaderboard';
import { weekStart } from '@/domain/plan/weekStrip';
import { todayIso } from '@/domain/plan/generator';
import { levelProgress } from '@/domain/gamification/levels';
import { nextTitle, titleForLevel } from '@/domain/gamification/titles';
import { titleName } from '@/features/gamification/titleName';
import { format } from '@/i18n';
import { useT } from '@/i18n';
import { progressSnapshot, useProgressStore } from '@/store/useProgressStore';
import { colors, radius, spacing, typography } from '@/theme';

const RAIL_SIZE = 6;

export function ProgressScreen() {
  const t = useT();
  const p = useProgressStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lp = levelProgress(p.xp);
  const owned = new Set(p.badges);
  const next = nextBadge(progressSnapshot(p), p.badges);
  // Newest medals first, then the next few still to earn, so the rail always shows a full row.
  const rail = [
    ...sortByEarned(p.badges, p.badgeDates).reverse().map((id) => ({ id, has: true })),
    ...BADGES.filter((b) => !owned.has(b.id)).map((b) => ({ id: b.id, has: false })),
  ].slice(0, RAIL_SIZE);
  const history = [...p.history].reverse().slice(0, 20);
  const weekFrom = weekStart(todayIso());
  const weekXp = xpSince(p.history, weekFrom);
  const weekWorkouts = workoutsSince(p.history, weekFrom);
  const totalCalories = p.history.reduce((a, r) => a + r.calories, 0);

  return (
    <Screen>
      <Title>{t.progress.title}</Title>
      <Pressable onPress={() => navigation.navigate('TitleUnlock', { level: lp.level })}>
      <Card style={{ borderColor: colors.accent }}>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <View style={{ flex: 1 }}>
            <Caption>{t.rank.yourTitle}</Caption>
            <Text style={styles.rank}>{titleName(t, titleForLevel(lp.level))}</Text>
          </View>
          <View style={styles.levelPill}>
            <Icon name="award" size={16} color={colors.warning} />
            <Text style={styles.levelText}>{lp.level}</Text>
          </View>
        </Row>
        <ProgressBar ratio={lp.ratio} color={colors.accent} />
        <Caption>
          {lp.current}/{lp.needed} XP · {format(t.rank.nextTitle, { title: titleName(t, nextTitle(p.xp).title), xp: nextTitle(p.xp).xpNeeded })}
        </Caption>
      </Card>
      </Pressable>
      <Card>
        <Row>
          <Stat label={t.progress.streak} value={`${p.streakDays}`} accent />
          <Stat label={t.progress.workouts} value={`${p.history.length}`} />
          <Stat label={t.progress.totalReps} value={`${p.totalReps}`} />
          <Stat label={t.progress.calories} value={`${totalCalories}`} />
        </Row>
      </Card>
      <Pressable onPress={() => navigation.navigate('Leaderboard')}>
        <Card>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Row style={{ flexWrap: 'nowrap', flex: 1 }}>
              <Icon name="trophy" size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Body strong>{t.leaderboard.title}</Body>
                <Caption>{format(t.leaderboard.workoutsCount, { n: weekWorkouts })} · {weekXp} XP</Caption>
              </View>
            </Row>
            <Caption style={{ color: colors.primary }}>{t.leaderboard.seeAll}</Caption>
          </Row>
        </Card>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Awards')} accessibilityRole="button">
        <Card>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Row style={{ flexWrap: 'nowrap', flex: 1 }}>
              <Icon name="award" size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Body strong>{t.awards.title}</Body>
                <Caption>
                  {format(t.awards.count, { n: p.badges.length, total: BADGES.length })}
                  {next ? ` · ${t.awards.nextUp}: ${t.badges[next.id as keyof typeof t.badges]?.name ?? next.id} ${next.progress.current}/${next.progress.target}` : ''}
                </Caption>
              </View>
            </Row>
            <Caption style={{ color: colors.primary }}>{t.awards.seeAll}</Caption>
          </Row>
          <View style={styles.medalRail}>
            {rail.map(({ id, has }) => (
              <AwardMedal key={id} badgeId={id} style={styleFor(id)} size={44} locked={!has} />
            ))}
          </View>
        </Card>
      </Pressable>
      <Subheading>{t.progress.history}</Subheading>
      {history.length === 0 ? <Body muted>{t.progress.noHistory}</Body> : null}
      {history.map((r) => (
        <Card key={r.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body strong>{r.date}</Body>
            <Caption>+{r.xp} XP</Caption>
          </Row>
          <Caption>
            {r.totalReps} {t.common.reps} · {Math.round(r.durationSec / 60)} {t.common.minutes} · {r.calories} {t.common.kcal} · {Math.round(r.avgQuality * 100)}%
          </Caption>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rank: { ...typography.h1, color: colors.accent, fontSize: 28, lineHeight: 34 },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.bgElevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  levelText: { ...typography.numberSm },
  medalRail: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
});
