import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { RootScreenProps } from '@/app/navigation/types';
import { Body, Button, Card, Row, Screen, Stat, Title } from '@/components/ui';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';
import { AwardMedal } from '@/components/AwardMedal';
import { styleFor } from '@/domain/gamification/awards';
import { titleForLevel } from '@/domain/gamification/titles';
import { XpBar } from '@/components/XpBar';
import { titleName } from '@/features/gamification/titleName';
import { useProgressStore } from '@/store/useProgressStore';
import { useT } from '@/i18n';
import { colors, fonts, spacing, typography } from '@/theme';

export function WorkoutCompleteScreen({ route, navigation }: RootScreenProps<'WorkoutComplete'>) {
  const t = useT();
  const { record, outcome } = route.params;
  const xp = useProgressStore((s) => s.xp);
  const fromXp = Math.max(0, xp - outcome.xpGained);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

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

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="trophy" size={44} color={colors.accent} />
          </View>
          <Title style={{ textAlign: 'center' }}>{t.complete.title}</Title>
          <Body muted style={{ textAlign: 'center' }}>{t.complete.subtitle}</Body>
        </View>
        <Card>
          <Row>
            <Stat label={t.complete.reps} value={`${record.totalReps}`} accent />
            <Stat label={t.complete.time} value={`${minutes}:${String(seconds).padStart(2, '0')}`} />
            <Stat label={t.complete.calories} value={`${record.calories}`} />
          </Row>
          <Row>
            <Stat label={t.complete.quality} value={`${Math.round(record.avgQuality * 100)}%`} />
            <Stat label={t.complete.xp} value={`+${outcome.xpGained}`} accent />
            <Stat label={t.progress.streak} value={`${outcome.streakDays}`} />
          </Row>
        </Card>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body muted>{t.complete.xpProgress}</Body>
            <Text style={styles.gain}>+{outcome.xpGained} XP</Text>
          </Row>
          <XpBar fromXp={fromXp} toXp={xp} levelLabel={(level) => titleName(t, titleForLevel(level))} />
        </Card>
        {outcome.newBadges.length > 0 ? (
          <Card style={{ borderColor: colors.warning }}>
            <Text style={styles.levelUp}>{t.complete.newBadge}</Text>
            {outcome.newBadges.map((id) => {
              const info = t.badges[id as keyof typeof t.badges];
              return (
                <Row key={id}>
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
        <View style={{ flex: 1 }} />
        <Button title={t.complete.continue} size="lg" onPress={continueFlow} />
      </Screen>
      <Confetti />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  heroIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  levelUp: { ...typography.h3, color: colors.accent, fontFamily: fonts.bold, fontSize: 18 },
  gain: { ...typography.numberMd, color: colors.accent, fontFamily: fonts.black },
});
