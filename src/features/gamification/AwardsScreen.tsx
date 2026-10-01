import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '@/app/navigation/types';
import { AwardMedal } from '@/components/AwardMedal';
import { Icon } from '@/components/Icon';
import { Caption, Overline, ProgressBar } from '@/components/ui';
import { formatAwardDate, sortByEarned, styleFor } from '@/domain/gamification/awards';
import { BADGES, BADGE_GROUPS, BadgeProgress, badgeProgress, nextBadge } from '@/domain/gamification/badges';
import { format, useI18nStore, useT } from '@/i18n';
import { progressSnapshot, useProgressStore } from '@/store/useProgressStore';
import { colors, fonts, radius, spacing, typography } from '@/theme';

const COLUMNS = 3;
const TILE_MEDAL = 76;

/**
 * The trophy cabinet: every award on its shelf, earned ones in full colour with
 * the date they were struck, locked ones dimmed with how far along they are.
 * Tapping any medal opens the ceremony page for it.
 */
export function AwardsScreen() {
  const t = useT();
  const language = useI18nStore((s) => s.language);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const p = useProgressStore();
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - spacing.md * 2 - spacing.sm * (COLUMNS - 1)) / COLUMNS);

  const snapshot = useMemo(() => progressSnapshot(p), [p]);
  const owned = useMemo(() => new Set(p.badges), [p.badges]);
  const latestId = sortByEarned(p.badges, p.badgeDates).at(-1);
  const next = nextBadge(snapshot, p.badges);
  const allIds = BADGES.map((b) => b.id);

  const open = (id: string) => navigation.navigate('Award', { badgeIds: allIds, index: allIds.indexOf(id), after: 'back' });
  const nameOf = (id: string) => t.badges[id as keyof typeof t.badges]?.name ?? id;
  const descOf = (id: string) => t.badges[id as keyof typeof t.badges]?.description ?? '';

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Cabinet summary: the tally on the left, the newest medal on the right. */}
        <View style={styles.hero}>
          <LinearGradient colors={['#1D2750', '#141B2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.heroText}>
            <Overline style={{ color: colors.warning }}>{t.awards.earned}</Overline>
            <View style={styles.tally}>
              <Text style={styles.tallyNum}>{p.badges.length}</Text>
              <Text style={styles.tallyOf}>/{BADGES.length}</Text>
            </View>
            <ProgressBar ratio={p.badges.length / BADGES.length} color={colors.warning} />
            <Caption>
              {p.badges.length >= BADGES.length ? t.awards.allEarned : format(t.awards.remaining, { n: BADGES.length - p.badges.length })}
            </Caption>
          </View>
          {latestId ? (
            <Pressable style={styles.heroMedal} onPress={() => open(latestId)} accessibilityRole="button">
              <AwardMedal badgeId={latestId} style={styleFor(latestId)} size={104} />
              <Overline style={styles.heroLatest}>{t.awards.latest}</Overline>
              <Text style={styles.heroName} numberOfLines={1}>{nameOf(latestId)}</Text>
            </Pressable>
          ) : (
            <View style={styles.heroMedal}>
              <AwardMedal badgeId="first_workout" style={styleFor('first_workout')} size={104} locked />
            </View>
          )}
        </View>

        {/* The locked award the user is closest to. */}
        {next ? (
          <Pressable style={styles.next} onPress={() => open(next.id)} accessibilityRole="button">
            <AwardMedal badgeId={next.id} style={styleFor(next.id)} size={64} locked />
            <View style={{ flex: 1, gap: 4 }}>
              <Overline style={{ color: styleFor(next.id).text }}>{t.awards.nextUp}</Overline>
              <Text style={styles.nextName}>{nameOf(next.id)}</Text>
              <Caption>{descOf(next.id)}</Caption>
              <ProgressRow progress={next.progress} color={styleFor(next.id).accent} />
            </View>
          </Pressable>
        ) : null}

        {/* One shelf per group. */}
        {BADGE_GROUPS.map((group) => {
          const shelf = BADGES.filter((b) => b.group === group);
          const earned = shelf.filter((b) => owned.has(b.id)).length;
          return (
            <View key={group} style={styles.shelf}>
              <View style={styles.shelfHead}>
                <Overline>{t.awards.groups[group]}</Overline>
                <Text style={styles.shelfCount}>{earned}/{shelf.length}</Text>
              </View>
              <View style={styles.grid}>
                {shelf.map((b) => {
                  const has = owned.has(b.id);
                  const s = styleFor(b.id);
                  const date = formatAwardDate(p.badgeDates[b.id], language);
                  const prog = badgeProgress(b.id, snapshot);
                  return (
                    <Pressable
                      key={b.id}
                      style={[styles.tile, { width: tileWidth }, has && { borderColor: tint(s.accent, 0.45) }]}
                      onPress={() => open(b.id)}
                      accessibilityRole="button"
                    >
                      {has ? <LinearGradient colors={[tint(s.accent, 0.16), 'transparent']} style={StyleSheet.absoluteFill} /> : null}
                      <AwardMedal badgeId={b.id} style={s} size={TILE_MEDAL} locked={!has} />
                      <Text style={[styles.tileName, !has && { color: colors.textMuted }]} numberOfLines={2}>{nameOf(b.id)}</Text>
                      {has ? (
                        <View style={styles.tileDate}>
                          <Icon name="check" size={10} color={s.text} strokeWidth={3} />
                          <Text style={[styles.tileDateText, { color: s.text }]}>{date}</Text>
                        </View>
                      ) : (
                        <View style={styles.tileProgress}>
                          <View style={styles.miniTrack}>
                            <View style={[styles.miniFill, { width: `${Math.round(prog.ratio * 100)}%` }]} />
                          </View>
                          <Text style={styles.tileProgressText}>{prog.current}/{prog.target}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressRow({ progress, color }: { progress: BadgeProgress; color: string }) {
  return (
    <View style={styles.progressRow}>
      <View style={{ flex: 1 }}>
        <ProgressBar ratio={progress.ratio} color={color} />
      </View>
      <Text style={styles.progressText}>
        {progress.current}
        <Text style={{ color: colors.textDim }}>/{progress.target}</Text>
      </Text>
    </View>
  );
}

/** `#RRGGBB` at the given alpha. */
function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  heroText: { flex: 1, gap: spacing.sm },
  tally: { flexDirection: 'row', alignItems: 'baseline' },
  tallyNum: { ...typography.numberLg, fontSize: 48, lineHeight: 52 },
  tallyOf: { ...typography.numberLg, fontSize: 22, lineHeight: 28, color: colors.textDim },
  heroMedal: { alignItems: 'center', width: 120, gap: 2 },
  heroLatest: { fontSize: 10, letterSpacing: 1.4, color: colors.textDim },
  heroName: { ...typography.caption, color: colors.text, fontFamily: fonts.semibold },
  next: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md },
  nextName: { ...typography.h3 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  progressText: { ...typography.numberSm, color: colors.text },
  shelf: { gap: spacing.sm },
  shelfHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 2 },
  shelfCount: { ...typography.numberSm, color: colors.textDim },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, paddingTop: spacing.sm, paddingBottom: spacing.md, paddingHorizontal: spacing.xs, alignItems: 'center', gap: 2, overflow: 'hidden' },
  tileName: { ...typography.caption, color: colors.text, fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, textAlign: 'center', minHeight: 32, marginTop: 2 },
  tileDate: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  tileDateText: { ...typography.numberSm, fontSize: 11, lineHeight: 14 },
  tileProgress: { width: '100%', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: spacing.xs },
  miniTrack: { width: '100%', height: 3, borderRadius: 2, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 2, backgroundColor: colors.textMuted },
  tileProgressText: { ...typography.numberSm, fontSize: 11, lineHeight: 14, color: colors.textDim },
});
