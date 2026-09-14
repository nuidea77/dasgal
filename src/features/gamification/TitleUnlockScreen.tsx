import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Share, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { RootScreenProps } from '@/app/navigation/types';
import { Button, Caption } from '@/components/ui';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';
import { nextTitle, titleForLevel } from '@/domain/gamification/titles';
import { TIER_COLORS, tierForLevel } from '@/domain/gamification/tiers';
import { format, useT } from '@/i18n';
import { useProgressStore } from '@/store/useProgressStore';
import { colors, radius, spacing } from '@/theme';
import { titleName } from './titleName';

/** Full-screen celebration shown when a new rank title is reached. */
export function TitleUnlockScreen({ route, navigation }: RootScreenProps<'TitleUnlock'>) {
  const t = useT();
  const level = route.params.level;
  const title = titleForLevel(level);
  const previous = titleForLevel(Math.max(1, level - 1));
  const tier = TIER_COLORS[tierForLevel(level)];
  const xp = useProgressStore((s) => s.xp);
  const workouts = useProgressStore((s) => s.history.length);
  const streak = useProgressStore((s) => s.streakDays);
  const next = nextTitle(xp);

  // Staggered entrance: rings → medal → title → details → button.
  const ring = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const medal = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const details = useRef(new Animated.Value(0)).current;
  const button = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(ring, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(medal, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: 450, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(details, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(button, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ring, pulse, medal, titleAnim, details, button]);

  const share = () => {
    void Share.share({ message: `${t.rank.shareText.replace('{title}', titleName(t, title))} #Dasgal` }).catch(() => undefined);
  };

  const ringScale = (base: number) => Animated.multiply(ring, Animated.add(base, Animated.multiply(pulse, 0.06)));

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0B1020', '#151B3A', '#0B1020']} style={StyleSheet.absoluteFill} />
      <Confetti count={140} />

      <View style={styles.content}>
        <View style={styles.medalArea}>
          {[620, 460, 320].map((size, i) => (
            <View
              key={size}
              style={[styles.glow, { width: size, height: size, borderRadius: size / 2, left: (MEDAL * 2.2 - size) / 2, top: (MEDAL * 2.2 - size) / 2, backgroundColor: tier.glow, opacity: 0.05 + i * 0.03 }]}
            />
          ))}
          {[2.1, 1.7, 1.35].map((s, i) => (
            <Animated.View
              key={s}
              style={[
                styles.ringCircle,
                { borderColor: tier.from, opacity: Animated.multiply(ring, 0.16 + i * 0.12), transform: [{ scale: ringScale(s) }] },
              ]}
            />
          ))}
          <Animated.View style={{ transform: [{ scale: medal }], opacity: medal }}>
            <LinearGradient colors={[tier.from, tier.to]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.medal}>
              <View style={styles.medalInner}>
                <Icon name="award" size={30} color={tier.from} strokeWidth={2.2} />
                <Text style={[styles.level, { color: tier.from }]}>{level}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        <Animated.View style={{ alignItems: 'center', opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
          <View style={[styles.pill, { borderColor: tier.from }]}>
            <Text style={[styles.pillText, { color: tier.text }]}>{t.rank.newTitle}</Text>
          </View>
          <Text style={styles.congrats}>{t.rank.unlockedTitle}</Text>
          <Text style={styles.body}>{t.rank.unlockedBody}</Text>
          <Text style={[styles.title, { color: tier.text }]}>{titleName(t, title)}</Text>
          {t.rank.unlockedTail ? <Text style={styles.body}>{t.rank.unlockedTail}</Text> : null}
        </Animated.View>

        <Animated.View style={[styles.details, { opacity: details }]}>
          <View style={styles.transition}>
            <Text style={styles.prev}>{titleName(t, previous)}</Text>
            <Icon name="trending" size={16} color={colors.textDim} />
            <Text style={[styles.now, { color: tier.text }]}>{titleName(t, title)}</Text>
          </View>
          <View style={styles.stats}>
            <Stat value={`${xp}`} label="XP" />
            <View style={styles.divider} />
            <Stat value={`${workouts}`} label={t.progress.workouts} />
            <View style={styles.divider} />
            <Stat value={`${streak}`} label={t.progress.streak} />
          </View>
          <Caption style={{ textAlign: 'center' }}>{format(t.rank.nextTitle, { title: titleName(t, next.title), xp: next.xpNeeded })}</Caption>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: button }]}>
        <Button title={t.rank.keepGoing} size="lg" onPress={() => navigation.popToTop()} />
        <Button title={t.rank.share} variant="ghost" onPress={share} />
      </Animated.View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const MEDAL = 150;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.lg, zIndex: 2 },
  medalArea: { width: MEDAL * 2.2, height: MEDAL * 2.2, alignItems: 'center', justifyContent: 'center' },
  ringCircle: { position: 'absolute', width: MEDAL, height: MEDAL, borderRadius: MEDAL / 2, borderWidth: 1.5 },
  medal: { width: MEDAL, height: MEDAL, borderRadius: MEDAL / 2, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  medalInner: { width: MEDAL - 22, height: MEDAL - 22, borderRadius: (MEDAL - 22) / 2, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 2 },
  level: { fontSize: 44, fontWeight: '900', lineHeight: 48 },
  pill: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm },
  pillText: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  congrats: { fontSize: 24, fontWeight: '800', color: colors.text },
  title: { fontSize: 40, fontWeight: '900', textAlign: 'center', marginTop: 2, letterSpacing: -0.5 },
  body: { color: colors.textMuted, fontSize: 15, marginTop: 4, textAlign: 'center' },
  details: { width: '100%', gap: spacing.md, backgroundColor: 'rgba(27,36,64,0.75)', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  transition: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  prev: { color: colors.textDim, fontWeight: '700', textDecorationLine: 'line-through' },
  now: { fontWeight: '800' },
  stats: { flexDirection: 'row', alignItems: 'center' },
  divider: { width: 1, height: 28, backgroundColor: colors.cardBorder },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.textDim, fontSize: 11 },
  footer: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs, zIndex: 2 },
});
