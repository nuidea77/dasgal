import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { Body, Caption, Card, ProgressBar, Row, Screen, Stat, Subheading, Title } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { BADGES } from '@/domain/gamification/badges';
import { levelProgress } from '@/domain/gamification/levels';
import { nextTitle, titleForLevel } from '@/domain/gamification/titles';
import { titleName } from '@/features/gamification/titleName';
import { format } from '@/i18n';
import { useT } from '@/i18n';
import { useProgressStore } from '@/store/useProgressStore';
import { colors, radius, spacing } from '@/theme';

export function ProgressScreen() {
  const t = useT();
  const p = useProgressStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lp = levelProgress(p.xp);
  const owned = new Set(p.badges);
  const history = [...p.history].reverse().slice(0, 20);
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
      <Subheading>{t.progress.badges}</Subheading>
      <View style={styles.badgeGrid}>
        {BADGES.map((b) => {
          const info = t.badges[b.id as keyof typeof t.badges];
          const has = owned.has(b.id);
          return (
            <View key={b.id} style={[styles.badge, !has && styles.badgeLocked]}>
              <View style={styles.badgeIcon}>
                <Icon name={has ? b.icon : 'lock'} size={26} color={has ? colors.warning : colors.textDim} />
              </View>
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
  rank: { color: colors.accent, fontSize: 26, fontWeight: '900' },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.bgElevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  levelText: { color: colors.text, fontWeight: '800' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: { width: '30%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.cardBorder },
  badgeLocked: { opacity: 0.4 },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  badgeName: { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
