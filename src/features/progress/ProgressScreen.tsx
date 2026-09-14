import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { Body, Caption, Card, ProgressBar, Row, Screen, Stat, Subheading, Title } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { AwardMedal } from '@/components/AwardMedal';
import { BADGES } from '@/domain/gamification/badges';
import { styleFor } from '@/domain/gamification/awards';
import { workoutsSince, xpSince } from '@/domain/gamification/leaderboard';
import { weekStart } from '@/domain/plan/weekStrip';
import { todayIso } from '@/domain/plan/generator';
import { levelProgress } from '@/domain/gamification/levels';
import { nextTitle, titleForLevel } from '@/domain/gamification/titles';
import { titleName } from '@/features/gamification/titleName';
import { format } from '@/i18n';
import { useT } from '@/i18n';
import { useProgressStore } from '@/store/useProgressStore';
import { colors, fonts, radius, spacing, typography } from '@/theme';

export function ProgressScreen() {
  const t = useT();
  const p = useProgressStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lp = levelProgress(p.xp);
  const owned = new Set(p.badges);
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

      <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <Subheading>{t.awards.title}</Subheading>
        <Caption>{format(t.awards.count, { n: p.badges.length, total: BADGES.length })}</Caption>
      </Row>
      <View style={styles.badgeGrid}>
        {BADGES.map((b, i) => {
          const info = t.badges[b.id as keyof typeof t.badges];
          const has = owned.has(b.id);
          return (
            <Pressable
              key={b.id}
              style={styles.badge}
              accessibilityRole="button"
              onPress={() => navigation.navigate('Award', { badgeIds: BADGES.map((x) => x.id), index: i, after: 'back' })}
            >
              <AwardMedal badgeId={b.id} style={styleFor(b.id)} size={64} locked={!has} />
              <Text style={[styles.badgeName, !has && { color: colors.textDim }]} numberOfLines={2}>{info?.name ?? b.id}</Text>
            </Pressable>
          );
        })}
      </View>
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
  rank: { ...typography.h1, color: colors.accent, fontFamily: fonts.black, fontSize: 26, lineHeight: 32 },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.bgElevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  levelText: { ...typography.numberSm },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: { width: '30%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.cardBorder },
  badgeName: { ...typography.caption, color: colors.text, fontFamily: fonts.semibold, fontSize: 12, textAlign: 'center' },
});
