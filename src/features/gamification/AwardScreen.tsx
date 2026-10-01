import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, Polygon, RadialGradient, Stop } from 'react-native-svg';
import { RootScreenProps } from '@/app/navigation/types';
import { AwardMedal } from '@/components/AwardMedal';
import { Icon } from '@/components/Icon';
import { LOCKED_STYLE, formatAwardDate, styleFor } from '@/domain/gamification/awards';
import { BADGES, badgeProgress } from '@/domain/gamification/badges';
import { format, useI18nStore, useT } from '@/i18n';
import { progressSnapshot, useProgressStore } from '@/store/useProgressStore';
import { colors, fonts, radius, spacing, typography } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');
/** How far the medal drifts up as it floats. */
const FLOAT_RISE = 10;
/** Room above the medal for that drift plus the entrance spring's overshoot. */
const HEADROOM = 24;
const MEDAL = Math.min(240, SCREEN_W * 0.62);
/** Radius of the sunburst behind an earned medal. */
const RAYS_R = MEDAL * 1.05;

/**
 * Full-screen award ceremony: the medal stands on a spotlit stage, one page per
 * award earned. Reached after a workout that unlocked badges, and from the
 * awards grid on the progress tab.
 */
export function AwardScreen({ route, navigation }: RootScreenProps<'Award'>) {
  const t = useT();
  const language = useI18nStore((s) => s.language);
  const { badgeIds, index = 0, after = 'home', level } = route.params;
  const insets = useSafeAreaInsets();
  const earnedAt = useProgressStore((s) => s.badgeDates);
  const owned = useProgressStore((s) => s.badges);
  const progress = useProgressStore((s) => s);
  const snapshot = useMemo(() => progressSnapshot(progress), [progress]);
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
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const turn = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 48000, easing: Easing.linear, useNativeDriver: true }));
    turn.start();
    return () => turn.stop();
  }, [spin]);

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
  const group = BADGES.find((b) => b.id === current)?.group;
  const req = badgeProgress(current, snapshot);

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

  const float = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0, -FLOAT_RISE] });
  const glowScale = shimmer.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#05070F', '#101736', '#05070F']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <Spotlight color={style.accent} progress={enter} scale={glowScale} />

      <Animated.View style={[styles.topBar, { paddingTop: insets.top + spacing.sm, opacity: footer }]}>
        <Pressable onPress={done} hitSlop={12} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel={t.awards.done}>
          <Icon name="close" size={18} color={colors.text} />
        </Pressable>
        {ids.length > 1 ? <Text style={styles.counter}>{format(t.awards.pageOf, { n: page + 1, total: ids.length })}</Text> : null}
      </Animated.View>

      <View style={styles.stage}>
      <Animated.View style={[styles.header, { opacity: text }]}>
        <Text style={styles.kicker}>
          {t.awards.kicker}
          {group ? <Text style={{ color: style.text }}>{`  ·  ${t.awards.groups[group]}`}</Text> : null}
        </Text>
        <Text style={styles.name}>{(info?.name ?? current).toUpperCase()}</Text>
        {isOwned && date ? (
          <View style={[styles.datePill, { borderColor: tint(style.accent, 0.5), backgroundColor: tint(style.accent, 0.12) }]}>
            <Icon name="check" size={12} color={style.text} strokeWidth={3} />
            <Text style={[styles.date, { color: style.text }]}>{date}</Text>
          </View>
        ) : (
          <View style={styles.datePill}>
            <Icon name="lock" size={12} color={colors.textMuted} />
            <Text style={styles.date}>{t.awards.notEarned}</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.pagerWrap}>
      <Animated.View style={[styles.rays, { opacity: isOwned ? Animated.multiply(medal, 0.4) : 0, transform: [{ rotate }] }]} pointerEvents="none">
        <Rays color={style.accent} />
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
      </View>

      <Animated.View style={[styles.body, { opacity: text, transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Text style={styles.congrats}>
          {isOwned ? t.awards.congrats : t.awards.howTo}
          <Text style={[styles.congratsStrong, { color: style.text }]}>{` ${info?.description ?? ''}`}</Text>
        </Text>
        {!isOwned ? (
          <View style={styles.reqRow}>
            <View style={styles.reqTrack}>
              <View style={[styles.reqFill, { width: `${Math.round(req.ratio * 100)}%`, backgroundColor: styleFor(current).accent }]} />
            </View>
            <Text style={styles.reqText}>
              {req.current}
              <Text style={{ color: colors.textDim }}>/{req.target}</Text>
            </Text>
          </View>
        ) : null}
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

/** A soft sunburst that turns slowly behind an earned medal. */
function Rays({ color }: { color: string }) {
  const n = 14;
  const wedges = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const half = Math.PI / n / 2.6;
    const p1 = `${50 + 50 * Math.cos(a - half)},${50 + 50 * Math.sin(a - half)}`;
    const p2 = `${50 + 50 * Math.cos(a + half)},${50 + 50 * Math.sin(a + half)}`;
    return <Polygon key={i} points={`50,50 ${p1} ${p2}`} fill="url(#ray)" />;
  });
  return (
    <Svg width={RAYS_R * 2} height={RAYS_R * 2} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="ray" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0.25" stopColor={color} stopOpacity="0.55" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {wedges}
    </Svg>
  );
}

/** `#RRGGBB` at the given alpha. */
function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
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
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  counter: { ...typography.numberSm, color: colors.textMuted },
  stage: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', paddingHorizontal: spacing.lg, gap: 2 },
  kicker: { ...typography.overline },
  name: { ...typography.display, textAlign: 'center', marginTop: spacing.xs },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: 'rgba(255,255,255,0.04)' },
  date: { ...typography.numberSm, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  pagerWrap: { marginTop: spacing.xl - HEADROOM },
  // The sunburst lives outside the pager so the pager's clipping never cuts it;
  // it is centred on the medal's resting position.
  rays: { position: 'absolute', top: HEADROOM + MEDAL / 2 - RAYS_R, left: SCREEN_W / 2 - RAYS_R, width: RAYS_R * 2, height: RAYS_R * 2 },
  // The pager is a ScrollView, so it clips: the medal drifts up by FLOAT_RISE
  // and the spring that brings it in overshoots past its resting size, and both
  // would shave the top off the badge without this headroom.
  pager: { flexGrow: 0 },
  page: { width: SCREEN_W, alignItems: 'center', paddingTop: HEADROOM },
  body: { paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  congrats: { ...typography.body, color: colors.textMuted, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  congratsStrong: { fontFamily: fonts.bold, letterSpacing: -0.2 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '100%', maxWidth: 280 },
  reqTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  reqFill: { height: '100%', borderRadius: 3 },
  reqText: { ...typography.numberSm, color: colors.text },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textDim, opacity: 0.6 },
  footer: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  doneBtn: { backgroundColor: colors.text, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  doneText: { ...typography.button, color: '#05070F', fontSize: 17 },
  shareBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  shareText: { ...typography.bodyStrong, color: colors.textMuted },
});
