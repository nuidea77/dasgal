import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '@/theme';

interface Props {
  min: number;
  max: number;
  /** Step between selectable values. */
  step?: number;
  value: number;
  onChange: (v: number) => void;
  /** Shown under the big number, e.g. "кг" or "см". */
  unit?: string;
  /** Optional caption under the picker (e.g. the healthy range). */
  hint?: string;
  /** Marks a reference value on the ruler (e.g. the current weight or a suggestion). */
  markerValue?: number;
  markerLabel?: string;
  /** Decimal places for the displayed value. */
  decimals?: number;
  accent?: string;
}

const ITEM_WIDTH = 14;
const TICK_HEIGHT = { major: 30, mid: 22, minor: 14 };

/**
 * Horizontal ruler picker: the value is chosen by sliding the scale under a fixed
 * centre needle, so it always opens centred on the current (average) value instead
 * of an empty text field. Snaps to `step` and gives light haptic feedback per tick.
 */
export function WheelPicker({ min, max, step = 1, value, onChange, unit, hint, markerValue, markerLabel, decimals = 0, accent = colors.accent }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const lastIndex = useRef<number>(-1);
  const count = Math.round((max - min) / step) + 1;
  const indexOf = useCallback((v: number) => Math.round((v - min) / step), [min, step]);
  const ticks = useMemo(() => Array.from({ length: count }, (_, i) => min + i * step), [count, min, step]);
  const pad = Math.max(0, width / 2 - ITEM_WIDTH / 2);

  // Keep the needle on the current value when the picker (re)opens or the value is set externally.
  useEffect(() => {
    if (width === 0) return;
    const x = indexOf(value) * ITEM_WIDTH;
    scrollRef.current?.scrollTo({ x, animated: false });
    lastIndex.current = indexOf(value);
  }, [width, indexOf, value]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
    const clamped = Math.min(count - 1, Math.max(0, idx));
    if (clamped === lastIndex.current) return;
    lastIndex.current = clamped;
    void Haptics.selectionAsync().catch(() => undefined);
    onChange(Math.round((min + clamped * step) * 100) / 100);
  };

  const markerIndex = markerValue !== undefined ? indexOf(markerValue) : -1;

  return (
    <View style={styles.wrap}>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: accent }]}>{value.toFixed(decimals)}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <View style={styles.rulerBox} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: pad }}
        >
          {ticks.map((tickValue, i) => {
            const isMajor = i % 10 === 0;
            const isMid = i % 5 === 0;
            const isMarker = i === markerIndex;
            return (
              <View key={tickValue} style={styles.tickSlot}>
                <View
                  style={[
                    styles.tick,
                    { height: isMajor ? TICK_HEIGHT.major : isMid ? TICK_HEIGHT.mid : TICK_HEIGHT.minor },
                    isMajor && { backgroundColor: colors.textMuted, width: 2 },
                    isMarker && { backgroundColor: colors.warning, width: 3, height: TICK_HEIGHT.major },
                  ]}
                />
                {isMajor ? <Text style={styles.tickLabel}>{tickValue.toFixed(0)}</Text> : null}
                {isMarker && markerLabel ? <Text style={styles.markerLabel}>{markerLabel}</Text> : null}
              </View>
            );
          })}
        </ScrollView>
        <View pointerEvents="none" style={styles.needleWrap}>
          <View style={[styles.needle, { backgroundColor: accent }]} />
          <View style={[styles.needleDot, { backgroundColor: accent }]} />
        </View>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 },
  value: { fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  unit: { fontSize: 18, fontWeight: '700', color: colors.textMuted },
  rulerBox: { height: 62, justifyContent: 'flex-start', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  tickSlot: { width: ITEM_WIDTH, alignItems: 'center', paddingTop: spacing.sm },
  tick: { width: 1.5, borderRadius: 1, backgroundColor: colors.textDim },
  tickLabel: { color: colors.textDim, fontSize: 10, marginTop: 2 },
  markerLabel: { position: 'absolute', bottom: 2, color: colors.warning, fontSize: 9, fontWeight: '700' },
  needleWrap: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'flex-start' },
  needle: { width: 3, height: 38, borderRadius: 2, marginTop: 4 },
  needleDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  hint: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 2 },
});
