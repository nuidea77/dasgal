import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { KEYPOINT_INDEX, SKELETON_EDGES } from '@/domain/pose/types';
import { colors, radius } from '@/theme';

interface Props {
  rest: number[][];
  active: number[][];
  size?: number;
  /** Seconds per full rep. */
  period?: number;
}

/**
 * Asset-free exercise demo: interpolates between two key poses of a stick figure.
 * Used when an exercise has no GIF, so the app works fully offline.
 */
export function StickFigureDemo({ rest, active, size = 220, period = 2.2 }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const [t, setT] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: (period * 1000) / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.delay(150),
        Animated.timing(anim, { toValue: 0, duration: (period * 1000) / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.delay(150),
      ]),
    );
    const id = anim.addListener(({ value }) => setT(value));
    loop.start();
    return () => {
      loop.stop();
      anim.removeListener(id);
    };
  }, [anim, period]);

  const points = useMemo(
    () =>
      rest.map((r, i) => {
        const a = active[i] ?? r;
        return { x: ((r[0] ?? 0) + ((a[0] ?? 0) - (r[0] ?? 0)) * t) * size, y: ((r[1] ?? 0) + ((a[1] ?? 0) - (r[1] ?? 0)) * t) * size };
      }),
    [rest, active, t, size],
  );

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {SKELETON_EDGES.map(([a, b]) => {
          const pa = points[KEYPOINT_INDEX[a]];
          const pb = points[KEYPOINT_INDEX[b]];
          if (!pa || !pb) return null;
          return <Line key={`${a}${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={colors.accent} strokeWidth={5} strokeLinecap="round" />;
        })}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 12 : 5} fill={i === 0 ? colors.accent : colors.white} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, alignSelf: 'center', overflow: 'hidden' },
});
