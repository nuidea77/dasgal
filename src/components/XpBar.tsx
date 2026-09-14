import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { levelForXp, xpForLevel } from '@/domain/gamification/levels';
import { colors, radius } from '@/theme';

interface Props {
  /** XP before the workout. */
  fromXp: number;
  /** XP after the workout. */
  toXp: number;
  /** Label for the current level shown on the left (e.g. the rank title). */
  levelLabel: (level: number) => string;
  onDone?: () => void;
}

/**
 * Animated XP progress: fills the bar from the old XP to the new XP, rolling over
 * into the next level (bar resets to zero) whenever a level boundary is crossed,
 * while the number counts up.
 */
export function XpBar({ fromXp, toXp, levelLabel, onDone }: Props) {
  const fill = useRef(new Animated.Value(0)).current;
  const [level, setLevel] = useState(levelForXp(fromXp));
  const [shownXp, setShownXp] = useState(fromXp);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let currentXp = fromXp;
      let currentLevel = levelForXp(fromXp);
      while (!cancelled) {
        const base = xpForLevel(currentLevel);
        const next = xpForLevel(currentLevel + 1);
        const span = next - base;
        const startRatio = (currentXp - base) / span;
        const crosses = toXp >= next;
        const endXp = crosses ? next : toXp;
        const endRatio = crosses ? 1 : (toXp - base) / span;
        setLevel(currentLevel);
        fill.setValue(startRatio);
        const duration = Math.max(350, Math.min(1400, (endRatio - startRatio) * 1400));
        await new Promise<void>((resolve) => {
          const id = fill.addListener(({ value }) => setShownXp(Math.round(base + value * span)));
          Animated.timing(fill, { toValue: endRatio, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => {
            fill.removeListener(id);
            resolve();
          });
        });
        currentXp = endXp;
        if (!crosses) break;
        currentLevel += 1;
        await new Promise((r) => setTimeout(r, 250));
      }
      if (!cancelled) onDone?.();
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromXp, toXp]);

  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.row}>
        <Text style={styles.label}>{levelLabel(level)}</Text>
        <Text style={styles.xp}>
          {shownXp - base} / {next - base} XP
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fillBar, { width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { color: colors.text, fontWeight: '800', fontSize: 16 },
  xp: { color: colors.textMuted, fontWeight: '600' },
  track: { height: 14, borderRadius: radius.pill, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  fillBar: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
});
