import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { BODY_REGIONS, BODY_VIEWBOX, BodySide, Region, WHOLE_BODY_GROUPS, groupsOnSide } from '@/domain/plan/bodyRegions';
import { MuscleGroup } from '@/domain/plan/exercises';
import { colors } from '@/theme';

const IMAGES: Record<BodySide, number> = {
  front: require('../../assets/body/body-front.png'),
  back: require('../../assets/body/body-back.png'),
};

interface Props {
  side: BodySide;
  /** Muscle groups to light up. */
  selected: MuscleGroup[];
  /** Width in points; the height follows the artwork's aspect ratio. */
  width?: number;
  accent?: string;
}

/**
 * Anatomical body illustration with the selected muscle groups lit up.
 * The figure is a bundled image; the highlights are SVG shapes positioned
 * over it (see domain/plan/bodyRegions).
 */
export function BodyMap({ side, selected, width = 220, accent = colors.accent }: Props) {
  const height = (width * BODY_VIEWBOX.height) / BODY_VIEWBOX.width;
  const wholeBody = selected.some((g) => WHOLE_BODY_GROUPS.includes(g));
  const active = wholeBody ? groupsOnSide(side) : selected;
  const regions: Region[] = active.flatMap((g) => BODY_REGIONS[side][g] ?? []);

  return (
    <View style={{ width, height }}>
      <Image source={IMAGES[side]} style={StyleSheet.absoluteFill} contentFit="contain" />
      <Svg viewBox={`0 0 ${BODY_VIEWBOX.width} ${BODY_VIEWBOX.height}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="muscleGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={accent} stopOpacity="0.95" />
            <Stop offset="0.72" stopColor={accent} stopOpacity="0.8" />
            <Stop offset="1" stopColor={accent} stopOpacity="0.25" />
          </RadialGradient>
        </Defs>
        {regions.map((r, i) => (
          <Ellipse
            key={i}
            cx={r.cx}
            cy={r.cy}
            rx={r.rx}
            ry={r.ry}
            fill="url(#muscleGlow)"
            origin={`${r.cx}, ${r.cy}`}
            rotation={r.rotate ?? 0}
          />
        ))}
      </Svg>
    </View>
  );
}
