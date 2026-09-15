import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, Polygon, RadialGradient, Stop } from 'react-native-svg';
import { RootScreenProps } from '@/app/navigation/types';
import { AwardMedal } from '@/components/AwardMedal';
import { Icon } from '@/components/Icon';
import { LOCKED_STYLE, formatAwardDate, styleFor } from '@/domain/gamification/awards';
import { useI18nStore, useT } from '@/i18n';
import { useProgressStore } from '@/store/useProgressStore';
import { colors, fonts, radius, spacing, typography } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const MEDAL = Math.min(240, SCREEN_W * 0.62);

/**
 * Full-screen award ceremony: the medal stands on a spotlit stage, one page per
 * award earned. Reached after a workout that unlocked badges, and from the
 * awards grid on the progress tab.
 */
export function AwardScreen({ route, navigation }: RootScreenProps<'Award'>) {
  const t = useT();
  const language = useI18nStore((s) => s.language);
  const { badgeIds, index = 0, after = 'home', level } = route.params;
  const earnedAt = useProgressStore((s) => s.badgeDates);
  const owned = useProgressStore((s) => s.badges);
  const ids = badgeIds.length > 0 ? badgeIds : ['first_workout'];
  const initial = Math.min(Math.max(0, index), ids.length - 1);
  const [page, setPage] = useState(initial);
  const pager = useRef<ScrollView | null>(null);
  const placed = useRef(false);

  const enter = useRef(new Animated.Value(0)).current;
  const medal = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const footer = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(enter, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(medal, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.timing(text, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(footer, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, medal, text, footer, shimmer]);

  const current = ids[Math.min(page, ids.length - 1)] ?? ids[0] ?? 'first_workout';
  const info = t.badges[current as keyof typeof t.badges];
  const style = owned.includes(current) ? styleFor(current) : LOCKED_STYLE;
  const date = formatAwardDate(earnedAt[current], language);
  const isOwned = owned.includes(current);

  const done = () => {
    if (after === 'title' && level !== undefined) navigation.replace('TitleUnlock', { level });
    else if (after === 'back' && navigation.canGoBack()) navigation.goBack();
    else navigation.popToTop();
  };

  const share = () => {
    void Share.share({ message: `${t.awards.shareText.replace('{award}', info?.name ?? current)} #Dasgal` }).catch(() => undefined);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== page) {
      setPage(next);
      void Haptics.selectionAsync();
    }
  };

  const float = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const glowScale = shimmer.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#05070F', '#101736', '#05070F']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <Spotlight color={style.accent} progress={enter} scale={glowScale} />

      <View style={styles.stage}>
      <Animated.View style={[styles.header, { opacity: text }]}>
        <Text style={styles.kicker}>{t.awards.kicker}</Text>
        <Text style={styles.name}>{(info?.name ?? current).toUpperCase()}</Text>
        {date ? <Text style={styles.date}>{date}</Text> : <Text style={styles.date}>{t.awards.notEarned}</Text>}
      </Animated.View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        scrollEnabled={ids.length > 1}
        contentOffset={{ x: initial * SCREEN_W, y: 0 }}
        ref={(r) => {
          pager.current = r;
          // Android/web ignore contentOffset, so jump to the tapped award once.
          if (r && !placed.current) {
            placed.current = true;
            r.scrollTo({ x: initial * SCREEN_W, animated: false });
          }
        }}
        style={styles.pager}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {ids.map((id) => (
            <View key={id} style={styles.page}>
              <Animated.View style={{ opacity: medal, transform: [{ scale: medal }, { translateY: float }] }}>
                <AwardMedal badgeId={id} style={styleFor(id)} size={MEDAL} locked={!owned.includes(id)} />
              </Animated.View>
              <Animated.View style={{ opacity: enter, marginTop: -MEDAL * 0.14 }}>
                <Pedestal id={id} color={owned.includes(id) ? styleFor(id).accent : LOCKED_STYLE.accent} width={MEDAL * 1.25} />
              </Animated.View>
            </View>
        ))}
      </ScrollView>

      <Animated.View style={[styles.body, { opacity: text, transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Text style={styles.congrats}>
          {isOwned ? t.awards.congrats : t.awards.howTo}
          <Text style={[styles.congratsStrong, { color: style.text }]}>{` ${info?.description ?? ''}`}</Text>
        </Text>
        {ids.length > 1 ? (
          <View style={styles.dots}>
            {ids.map((id, i) => (
              <View key={id} style={[styles.dot, i === page && { backgroundColor: colors.text, width: 8 }]} />
            ))}
          </View>
        ) : null}
      </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: footer }]}>
        <Pressable style={styles.doneBtn} onPress={done} accessibilityRole="button">
          <Text style={styles.doneText}>{t.awards.done}</Text>
        </Pressable>
        {isOwned ? (
          <Pressable style={styles.shareBtn} onPress={share} accessibilityRole="button">
            <Icon name="arrowUp" size={16} color={colors.textMuted} />
            <Text style={styles.shareText}>{t.awards.share}</Text>
          </Pressable>
        ) : (
          <View style={styles.shareBtn} />
        )}
      </Animated.View>
    </View>
  );
}

/** Stage lighting: two cones of light meeting on the medal plus a warm wash. */
function Spotlight({ color, progress, scale }: { color: string; progress: Animated.Value; scale: Animated.AnimatedInterpolation<number> }) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress, transform: [{ scale }] }]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="wash" cx="0.5" cy="0.45" r="0.55">
            <Stop offset="0" stopColor={color} stopOpacity="0.38" />
            <Stop offset="0.6" stopColor={color} stopOpacity="0.1" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="beam" cx="0.5" cy="0" r="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.13" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Polygon points="32,0 68,0 100,62 0,62" fill="url(#beam)" />
        <Polygon points="41,0 59,0 78,58 22,58" fill="url(#beam)" opacity={0.75} />
        <Ellipse cx="50" cy="45" rx="55" ry="45" fill="url(#wash)" />
      </Svg>
    </Animated.View>
  );
}

/** The lit disc the medal stands on, with its reflection. */
function Pedestal({ id, color, width }: { id: string; color: string; width: number }) {
  const gid = `floor-${id}`;
  const sid = `shade-${id}`;
  return (
    <Svg width={width} height={width * 0.3} viewBox="0 0 100 30">
      <Defs>
        <RadialGradient id={gid} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={color} stopOpacity="0.55" />
          <Stop offset="0.55" stopColor={color} stopOpacity="0.16" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={sid} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.5" />
          <Stop offset="0.65" stopColor="#000000" stopOpacity="0.28" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="50" cy="15" rx="50" ry="14" fill={`url(#${gid})`} />
      <Ellipse cx="50" cy="11" rx="27" ry="5.5" fill={`url(#${sid})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05070F' },
  stage: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', paddingHorizontal: spacing.lg, gap: 2 },
  kicker: { ...typography.overline },
  name: { ...typography.display, textAlign: 'center', marginTop: spacing.xs },
  date: { ...typography.numberSm, fontSize: 15, lineHeight: 20, color: colors.textMuted, marginTop: spacing.xs },
  pager: { flexGrow: 0, marginTop: spacing.xl },
  page: { width: SCREEN_W, alignItems: 'center' },
  body: { paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  congrats: { ...typography.body, color: colors.textMuted, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  congratsStrong: { fontFamily: fonts.bold, letterSpacing: -0.2 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textDim, opacity: 0.6 },
  footer: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  doneBtn: { backgroundColor: colors.text, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  doneText: { ...typography.button, color: '#05070F', fontSize: 17 },
  shareBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  shareText: { ...typography.bodyStrong, color: colors.textMuted },
});
