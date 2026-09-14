import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Caption, Card, ProgressBar, Row, Screen, Stat, Subheading, Title } from '@/components/ui';
import { BADGES } from '@/domain/gamification/badges';
import { levelProgress } from '@/domain/gamification/levels';
import { useT } from '@/i18n';
import { useProgressStore } from '@/store/useProgressStore';
import { colors, radius, spacing } from '@/theme';

export function ProgressScreen() {
  const t = useT();
  const p = useProgressStore();
  const lp = levelProgress(p.xp);
  const owned = new Set(p.badges);
  const history = [...p.history].reverse().slice(0, 20);
  const totalCalories = p.history.reduce((a, r) => a + r.calories, 0);

  return (
    <Screen>
      <Title>{t.progress.title}</Title>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Subheading>
            {t.progress.level} {lp.level}
          </Subheading>
          <Caption>
            {lp.current}/{lp.needed} XP {t.progress.xpToNext}
          </Caption>
        </Row>
        <ProgressBar ratio={lp.ratio} color={colors.accent} />
      </Card>
      <Card>
        <Row>
          <Stat label={t.progress.streak} value={`${p.streakDays}🔥`} accent />
          <Stat label={t.progress.workouts} value={`${p.history.length}`} />
          <Stat label={t.progress.totalReps} value={`${p.totalReps}`} />
          <Stat label={t.progress.calories} value={`${totalCalories}`} />
        </Row>
      </Card>
      <Subheading>{t.progress.badges}</Subheading>
      <View style={styles.badgeGrid}>
        {BADGES.map((b) => {
          const info = t.badges[b.id as keyof typeof t.badges];
          const has = owned.has(b.id);
          return (
            <View key={b.id} style={[styles.badge, !has && styles.badgeLocked]}>
              <Text style={styles.badgeIcon}>{has ? b.icon : '🔒'}</Text>
              <Text style={styles.badgeName} numberOfLines={2}>{info?.name ?? b.id}</Text>
            </View>
          );
        })}
      </View>
      <Subheading>{t.progress.history}</Subheading>
      {history.length === 0 ? <Body muted>{t.progress.noHistory}</Body> : null}
      {history.map((r) => (
        <Card key={r.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body style={{ fontWeight: '700' }}>{r.date}</Body>
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
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: { width: '30%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.cardBorder },
  badgeLocked: { opacity: 0.4 },
  badgeIcon: { fontSize: 30 },
  badgeName: { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
