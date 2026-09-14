import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, G, Line } from 'react-native-svg';
import { KEYPOINT_INDEX, SKELETON_EDGES } from '@/domain/pose/types';
import { EXERCISE_PHOTOS } from '@/components/exerciseAssets';
import { colors, fonts, radius, spacing, typography } from '@/theme';

/**
 * Joint positions read off assets/exercises/squat.jpg, normalised to the photo
 * (4:3). Ordered like KEYPOINT_NAMES. The athlete is side-on, so the far-side
 * joints sit a little behind the near ones — the same way a real pose reads.
 */
const SQUAT_JOINTS: Array<[number, number]> = [
  [0.556, 0.291], // nose
  [0.538, 0.281], // left_eye
  [0.529, 0.285], // right_eye
  [0.497, 0.272], // left_ear
  [0.489, 0.277], // right_ear
  [0.456, 0.354], // left_shoulder
  [0.447, 0.362], // right_shoulder
  [0.576, 0.351], // left_elbow
  [0.568, 0.359], // right_elbow
  [0.700, 0.347], // left_wrist
  [0.693, 0.355], // right_wrist
  [0.450, 0.502], // left_hip
  [0.442, 0.510], // right_hip
  [0.524, 0.568], // left_knee
  [0.514, 0.576], // right_knee
  [0.479, 0.694], // left_ankle
  [0.470, 0.702], // right_ankle
];

const VB_W = 400;
const VB_H = 300;
const REPS_IN_LOOP = 12;

interface Props {
  /** Width in points; the height follows the photo's 4:3 frame. */
  width: number;
}

/**
 * The onboarding hero: a real exercise photo inside a camera frame with the
 * pose skeleton locked onto the athlete and a rep counter ticking up — the
 * app's whole premise in one picture.
 */
export function CameraHero({ width }: Props) {
  const height = (width * 3) / 4;
  const scan = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [reps, setReps] = useState(1);

  useEffect(() => {
    const sweep = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(scan, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    sweep.start();
    blink.start();
    const tick = setInterval(() => setReps((r) => (r >= REPS_IN_LOOP ? 1 : r + 1)), 1300);
    return () => {
      sweep.stop();
      blink.stop();
      clearInterval(tick);
    };
  }, [scan, pulse]);

  const points = useMemo(() => SQUAT_JOINTS.map(([x, y]) => ({ x: x * VB_W, y: y * VB_H })), []);

  return (
    <View style={[styles.frame, { width, height }]}>
      <Image source={EXERCISE_PHOTOS.squat} style={StyleSheet.absoluteFill} contentFit="cover" />

      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} style={StyleSheet.absoluteFill}>
        <G opacity={0.95}>
          {SKELETON_EDGES.map(([a, b]) => {
            const pa = points[KEYPOINT_INDEX[a]];
            const pb = points[KEYPOINT_INDEX[b]];
            if (!pa || !pb) return null;
            return (
              <Line
                key={`${a}-${b}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={colors.accent}
                strokeWidth={2.6}
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })}
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={i < 5 ? 2.4 : 3.6} fill={colors.white} stroke={colors.accent} strokeWidth={1.6} />
          ))}
        </G>
      </Svg>

      {/* A scan line sweeping the frame, the way the detector reads it. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.scan,
          { transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }], opacity: scan.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] }) },
        ]}
      />

      {/* Framing brackets, as on the workout screen. */}
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />

      <View style={styles.chip}>
        <Animated.View style={[styles.dot, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }]} />
        <Text style={styles.chipText}>AI</Text>
      </View>

      <View style={styles.counter}>
        <Text style={styles.counterValue}>{reps}</Text>
        <Text style={styles.counterUnit}>/{REPS_IN_LOOP}</Text>
      </View>
    </View>
  );
}

const C = 22;
const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scan: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.accent, opacity: 0.6 },
  corner: { position: 'absolute', width: C, height: C, borderColor: colors.accent },
  tl: { top: 12, left: 12, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 8 },
  tr: { top: 12, right: 12, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 8 },
  bl: { bottom: 12, left: 12, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 8 },
  br: { bottom: 12, right: 12, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 8 },
  chip: {
    position: 'absolute',
    top: 18,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  chipText: { ...typography.overline, color: colors.white, fontSize: 10, letterSpacing: 1.6 },
  counter: {
    position: 'absolute',
    right: 44,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    backgroundColor: colors.overlay,
  },
  counterValue: { ...typography.numberLg, fontSize: 30, lineHeight: 34, color: colors.white },
  counterUnit: { ...typography.numberSm, color: colors.textMuted, fontFamily: fonts.bold },
});
