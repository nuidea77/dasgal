import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DayState, StripDay, weekIndexOf } from '@/domain/plan/weekStrip';
import { useT } from '@/i18n';
import { colors, fonts, radius, spacing, typography } from '@/theme';

interface Props {
  strip: StripDay[];
  today: string;
  onSelect: (dayIndex: number) => void;
}

const DOT_COLOR: Partial<Record<DayState, string>> = {
  done: colors.accent,
  missed: colors.danger,
  workout: colors.primary,
};

/**
 * Monday-aligned week strip: seven day cells per page, snapping week by week and
 * opening on the current week. Today is filled; each day carries a dot for its
 * state (done, missed, scheduled).
 */
export function WeekStrip({ strip, today, onSelect }: Props) {
  const t = useT();
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const todayWeek = useMemo(() => weekIndexOf(strip, today), [strip, today]);
  const [week, setWeek] = useState(todayWeek);
  const weeks = Math.ceil(strip.length / 7);

  const scrollToWeek = useCallback(
    (index: number, animated = false) => {
      if (width === 0) return;
      scrollRef.current?.scrollTo({ x: index * width, animated });
      setWeek(index);
    },
    [width],
  );

  useEffect(() => {
    scrollToWeek(todayWeek);
  }, [width, todayWeek, scrollToWeek]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    setWeek(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const current = strip.slice(week * 7, week * 7 + 7);
  const planned = current.filter((d) => d.state !== 'outside' && d.state !== 'rest');
  const done = current.filter((d) => d.state === 'done').length;

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.head}>
        <Text style={styles.headLabel}>{week === todayWeek ? t.plan.thisWeek : current[0]?.date.slice(0, 7)}</Text>
        <View style={styles.headRight}>
          <Text style={styles.headCount}>
            {done}/{planned.length}
          </Text>
          {week !== todayWeek ? (
            <Pressable onPress={() => scrollToWeek(todayWeek, true)} hitSlop={8}>
              <Text style={styles.jump}>{t.plan.jumpToday}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          scrollEventThrottle={16}
        >
          {Array.from({ length: weeks }, (_, w) => (
            <View key={w} style={[styles.page, { width }]}>
              {strip.slice(w * 7, w * 7 + 7).map((d) => {
                const outside = d.state === 'outside';
                return (
                  <Pressable
                    key={d.date}
                    disabled={outside || d.dayIndex === null}
                    onPress={() => d.dayIndex !== null && onSelect(d.dayIndex)}
                    style={[styles.cell, d.isToday && styles.cellToday, outside && styles.cellOutside]}
                  >
                    <Text style={[styles.weekday, d.isToday && styles.textOnAccent]}>{t.weekdays[d.weekday]}</Text>
                    <Text style={[styles.date, d.isToday && styles.textOnAccent]}>{d.dayOfMonth}</Text>
                    <View style={[styles.dot, { backgroundColor: DOT_COLOR[d.state] ?? 'transparent' }, d.isToday && d.state !== 'rest' && { backgroundColor: colors.bg }]} />
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headLabel: { ...typography.bodyStrong, color: colors.textMuted, fontSize: 14 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headCount: { ...typography.numberSm, color: colors.textDim, fontSize: 12, lineHeight: 16 },
  jump: { ...typography.caption, color: colors.primary, fontFamily: fonts.bold, fontSize: 12 },
  page: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 10, borderRadius: radius.md, marginHorizontal: 2 },
  cellToday: { backgroundColor: colors.accent },
  cellOutside: { opacity: 0.25 },
  weekday: { ...typography.overline, fontSize: 10, letterSpacing: 0.8 },
  date: { ...typography.numberSm, fontSize: 17, lineHeight: 21 },
  textOnAccent: { color: colors.bg },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
