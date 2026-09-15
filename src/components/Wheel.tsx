import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, typography } from '@/theme';

interface BaseProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  /** Formats each item; defaults to the plain number. */
  format?: (v: number) => string;
  accent?: string;
}

/** Items rendered either side of the selected one. */
const SIDE = 3;

interface WheelProps extends BaseProps {
  /** Height of one row (vertical) or width of one column (horizontal). */
  itemSize?: number;
  /** Unit caption shown under the pointer (horizontal wheel only). */
  unit?: string;
}

/**
 * Vertical value wheel: the selected number sits between two accent rules and is
 * rendered larger; neighbours fade out with distance. Snaps and gives haptic ticks.
 */
export function VerticalWheel({ min, max, step = 1, value, onChange, format, accent = colors.primary, itemSize = 58 }: WheelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastIndex = useRef(-1);
  const count = Math.round((max - min) / step) + 1;
  const values = useMemo(() => Array.from({ length: count }, (_, i) => Math.round((min + i * step) * 100) / 100), [count, min, step]);
  const indexOf = useCallback((v: number) => Math.min(count - 1, Math.max(0, Math.round((v - min) / step))), [count, min, step]);
  const height = itemSize * (SIDE * 2 + 1);

  useEffect(() => {
    const idx = indexOf(value);
    if (idx === lastIndex.current) return;
    lastIndex.current = idx;
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: idx * itemSize, animated: false }));
  }, [value, indexOf, itemSize]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.min(count - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / itemSize)));
    if (idx === lastIndex.current) return;
    lastIndex.current = idx;
    void Haptics.selectionAsync().catch(() => undefined);
    onChange(values[idx]!);
  };

  return (
    <View style={[styles.vWrap, { height }]}>
      <View pointerEvents="none" style={[styles.vLine, { top: height / 2 - itemSize / 2, backgroundColor: accent }]} />
      <View pointerEvents="none" style={[styles.vLine, { top: height / 2 + itemSize / 2, backgroundColor: accent }]} />
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemSize}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true, listener: handleScroll })}
        contentContainerStyle={{ paddingVertical: itemSize * SIDE }}
      >
        {values.map((v, i) => {
          const inputRange = [(i - 3) * itemSize, (i - 1) * itemSize, i * itemSize, (i + 1) * itemSize, (i + 3) * itemSize];
          const opacity = scrollY.interpolate({ inputRange, outputRange: [0.25, 0.6, 1, 0.6, 0.25], extrapolate: 'clamp' });
          const scale = scrollY.interpolate({ inputRange, outputRange: [0.72, 0.86, 1, 0.86, 0.72], extrapolate: 'clamp' });
          const selected = i === indexOf(value);
          return (
            <Animated.View key={v} style={[styles.vItem, { height: itemSize, opacity, transform: [{ scale }] }]}>
              <Text style={[styles.vText, selected && { color: accent, fontSize: 40, fontFamily: fonts.display }]}>{format ? format(v) : v}</Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

/**
 * Horizontal value wheel: a row of numbers with the selected one enlarged above a
 * pointer. Used where the range is narrow enough to read at a glance (weight).
 */
export function HorizontalWheel({ min, max, step = 1, value, onChange, format, accent = colors.primary, itemSize = 86, unit }: WheelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const lastIndex = useRef(-1);
  const count = Math.round((max - min) / step) + 1;
  const values = useMemo(() => Array.from({ length: count }, (_, i) => Math.round((min + i * step) * 100) / 100), [count, min, step]);
  const indexOf = useCallback((v: number) => Math.min(count - 1, Math.max(0, Math.round((v - min) / step))), [count, min, step]);
  const width = itemSize * 5;

  useEffect(() => {
    const idx = indexOf(value);
    if (idx === lastIndex.current) return;
    lastIndex.current = idx;
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: idx * itemSize, animated: false }));
  }, [value, indexOf, itemSize]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.min(count - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / itemSize)));
    if (idx === lastIndex.current) return;
    lastIndex.current = idx;
    void Haptics.selectionAsync().catch(() => undefined);
    onChange(values[idx]!);
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width, height: 80 }}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemSize}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true, listener: handleScroll })}
          contentContainerStyle={{ paddingHorizontal: itemSize * 2 }}
        >
          {values.map((v, i) => {
            const inputRange = [(i - 2) * itemSize, (i - 1) * itemSize, i * itemSize, (i + 1) * itemSize, (i + 2) * itemSize];
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 0.6, 1, 0.6, 0.3], extrapolate: 'clamp' });
            const scale = scrollX.interpolate({ inputRange, outputRange: [0.65, 0.8, 1, 0.8, 0.65], extrapolate: 'clamp' });
            const selected = i === indexOf(value);
            return (
              <Animated.View key={v} style={[styles.hItem, { width: itemSize, opacity, transform: [{ scale }] }]}>
                <Text style={[styles.hText, selected && { color: accent, fontSize: 42, fontFamily: fonts.display }]}>{format ? format(v) : v}</Text>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>
      </View>
      <View style={[styles.pointer, { borderBottomColor: accent }]} />
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  vWrap: { alignSelf: 'stretch' },
  vLine: { position: 'absolute', left: '18%', right: '18%', height: 2, borderRadius: 1, zIndex: 2 },
  vItem: { alignItems: 'center', justifyContent: 'center' },
  vText: { ...typography.numberMd, fontSize: 24, lineHeight: 30, color: colors.text },
  hItem: { alignItems: 'center', justifyContent: 'center', height: 80 },
  hText: { ...typography.numberMd, fontSize: 22, lineHeight: 28, color: colors.text },
  unit: { ...typography.overline, color: colors.textMuted, fontSize: 12, letterSpacing: 1.6, marginTop: 6 },
  pointer: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '180deg' }], marginTop: 2 },
});
