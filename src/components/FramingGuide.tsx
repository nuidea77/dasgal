import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { FramingStatus } from '@/domain/pose/framing';
import { useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

interface Props {
  width: number;
  height: number;
  status: FramingStatus;
}

/**
 * Dashed rectangle showing where the whole body should be, plus one instruction.
 * Turns green when the athlete is correctly framed.
 */
export function FramingGuide({ width, height, status }: Props) {
  const t = useT();
  const ok = status === 'ok';
  const inset = Math.round(width * 0.12);
  const top = Math.round(height * 0.06);
  const stroke = ok ? colors.accent : colors.warning;
  const message = t.workout[`framing_${status}` as const];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Rect
          x={inset}
          y={top}
          width={width - inset * 2}
          height={height - top * 2}
          rx={28}
          stroke={stroke}
          strokeWidth={3}
          strokeDasharray={ok ? undefined : '14 10'}
          fill="none"
          opacity={0.9}
        />
      </Svg>
      <View style={[styles.banner, { backgroundColor: ok ? 'rgba(46,230,166,0.18)' : 'rgba(255,184,77,0.18)', borderColor: stroke }]}>
        <Text style={[styles.bannerText, { color: stroke }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: spacing.lg + 40,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: '85%',
  },
  bannerText: { fontWeight: '700', fontSize: 15, textAlign: 'center' },
});
