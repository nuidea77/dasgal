import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { RootScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption } from '@/components/ui';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';
import { titleForLevel } from '@/domain/gamification/titles';
import { useT } from '@/i18n';
import { colors, spacing } from '@/theme';
import { titleName } from './titleName';

/** Full-screen celebration shown when a new rank title is reached. */
export function TitleUnlockScreen({ route, navigation }: RootScreenProps<'TitleUnlock'>) {
  const t = useT();
  const title = titleForLevel(route.params.level);
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
        <View style={styles.badge}>
          <Icon name="award" size={64} color={colors.warning} strokeWidth={1.6} />
        </View>
        <Text style={styles.congrats}>{t.rank.unlockedTitle}</Text>
        <Body muted style={{ textAlign: 'center' }}>{t.rank.unlockedBody}</Body>
        <Text style={styles.title}>{titleName(t, title)}</Text>
        {t.rank.unlockedTail ? <Body muted style={{ textAlign: 'center' }}>{t.rank.unlockedTail}</Body> : null}
        <Caption style={{ marginTop: spacing.sm }}>
          {t.progress.level} {title.level}
        </Caption>
      </Animated.View>
      <View style={styles.footer}>
        <Button title={t.rank.keepGoing} size="lg" onPress={() => navigation.popToTop()} />
      </View>
      <Confetti count={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.lg },
  center: { alignItems: 'center', gap: spacing.sm },
  badge: { width: 128, height: 128, borderRadius: 64, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.warning, marginBottom: spacing.md },
  congrats: { fontSize: 30, fontWeight: '900', color: colors.text },
  title: { fontSize: 36, fontWeight: '900', color: colors.accent, textAlign: 'center', marginTop: spacing.xs },
  footer: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.xxl },
});
