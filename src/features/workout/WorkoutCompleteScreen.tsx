import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { RootScreenProps } from '@/app/navigation/types';
import { Body, Button, Card, Row, Screen, Stat, Title } from '@/components/ui';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';
import { BADGES } from '@/domain/gamification/badges';
import { useT } from '@/i18n';
import { colors, spacing } from '@/theme';

export function WorkoutCompleteScreen({ route, navigation }: RootScreenProps<'WorkoutComplete'>) {
  const t = useT();
  const { record, outcome } = route.params;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

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
        {outcome.leveledUp ? (
          <Card style={{ borderColor: colors.accent }}>
            <Row>
              <Icon name="arrowUp" color={colors.accent} />
              <Text style={styles.levelUp}>{t.complete.levelUp}</Text>
            </Row>
            <Body>
              {t.progress.level} {outcome.level}
            </Body>
          </Card>
        ) : null}
        {outcome.newBadges.length > 0 ? (
          <Card style={{ borderColor: colors.warning }}>
            <Text style={styles.levelUp}>{t.complete.newBadge}</Text>
            {outcome.newBadges.map((id) => {
              const def = BADGES.find((b) => b.id === id);
              const info = t.badges[id as keyof typeof t.badges];
              return (
                <Row key={id}>
                  <Icon name={def?.icon ?? 'award'} size={30} color={colors.warning} />
                  <View>
                    <Body style={{ fontWeight: '700' }}>{info?.name ?? id}</Body>
                    <Body muted>{info?.description}</Body>
                  </View>
                </Row>
              );
            })}
          </Card>
        ) : null}
        <View style={{ flex: 1 }} />
        <Button title={t.complete.continue} size="lg" onPress={() => navigation.popToTop()} />
      </Screen>
      <Confetti />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  heroIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  levelUp: { color: colors.accent, fontWeight: '800', fontSize: 18 },
});
