import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { MetalPalette } from '@/domain/gamification/awards';
import { Icon, IconName } from '@/components/Icon';

const VB = 200;
const C = VB / 2;

/** Knurled teeth around the rim, like a struck coin. */
function teeth(count: number, inner: number, outer: number, width: number): string {
  let d = '';
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    const half = width / 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const px = -sa * half;
    const py = ca * half;
    const pt = (r: number, s: number) => `${(C + ca * r + px * s).toFixed(1)} ${(C + sa * r + py * s).toFixed(1)}`;
    d += `M${pt(inner, 1)}L${pt(outer, 1)}L${pt(outer, -1)}L${pt(inner, -1)}Z`;
  }
  return d;
}

const TEETH = teeth(64, 86, 97, 5);

/** SVG gradient ids are document-global, so every medal needs its own set. */
let seq = 0;

/** Palette used for an award that has not been earned yet. */
export const LOCKED_METAL: MetalPalette = {
  rim: '#222A45', dark: '#39425F', base: '#4B5474', light: '#6B7394', shine: '#8A93B4', glow: '#5A6486', text: '#9AA3C2',
};

interface Props {
  icon: IconName;
  palette: MetalPalette;
  size?: number;
  /** Struck but not yet earned: drained of colour. */
  locked?: boolean;
}

/**
 * A struck metal award medal. Everything is drawn with gradients rather than a
 * bitmap, so any badge icon can be minted at any size without a new asset.
 */
export function AwardMedal({ icon, palette, size = 220, locked = false }: Props) {
  const p = locked ? LOCKED_METAL : palette;
  const iconSize = size * 0.26;
  const shown: IconName = locked ? 'lock' : icon;
  const uid = useMemo(() => {
    seq += 1;
    return `am${seq}`;
  }, []);
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          <LinearGradient id={id("metalBody")} x1="0.15" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor={p.light} />
            <Stop offset="0.28" stopColor={p.base} />
            <Stop offset="0.5" stopColor={p.shine} />
            <Stop offset="0.72" stopColor={p.base} />
            <Stop offset="1" stopColor={p.dark} />
          </LinearGradient>
          <LinearGradient id={id("metalRim")} x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={p.light} />
            <Stop offset="0.45" stopColor={p.dark} />
            <Stop offset="1" stopColor={p.rim} />
          </LinearGradient>
          <RadialGradient id={id("face")} cx="0.38" cy="0.3" r="0.8">
            <Stop offset="0" stopColor={p.light} />
            <Stop offset="0.55" stopColor={p.base} />
            <Stop offset="1" stopColor={p.dark} />
          </RadialGradient>
          <RadialGradient id={id("wellShade")} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0.6" stopColor={p.rim} stopOpacity="0" />
            <Stop offset="1" stopColor={p.rim} stopOpacity="0.55" />
          </RadialGradient>
          <LinearGradient id={id("specular")} x1="0" y1="0" x2="0.6" y2="1">
            <Stop offset="0" stopColor={p.shine} stopOpacity="0.8" />
            <Stop offset="1" stopColor={p.shine} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Thickness: a darker disc offset down reads as the medal's side wall. */}
        <Circle cx={C} cy={C + 5} r={97} fill={p.rim} opacity={0.95} />
        <Path d={TEETH} fill={url("metalRim")} />
        <Circle cx={C} cy={C} r={90} fill={url("metalBody")} />
        <Circle cx={C} cy={C} r={78} fill={url("face")} />
        <Circle cx={C} cy={C} r={78} fill={url("wellShade")} />
        <Circle cx={C} cy={C} r={78} stroke={p.rim} strokeWidth={1.5} fill="none" opacity={0.6} />
        <Circle cx={C} cy={C} r={68} stroke={p.light} strokeWidth={1} fill="none" opacity={0.4} />

        {/* Glass highlight across the top-left quarter. */}
        <Path d={`M${C} ${C - 90}A90 90 0 0 0 ${C - 90} ${C}A118 118 0 0 1 ${C} ${C - 90}Z`} fill={url("specular")} />
        <Circle cx={C - 34} cy={C - 42} r={12} fill={p.shine} opacity={0.22} />
      </Svg>

      {/* Engraved icon: a dark copy pushed down under a bright one. */}
      <View style={{ position: 'absolute', opacity: 0.8, transform: [{ translateY: 2 }] }} pointerEvents="none">
        <Icon name={shown} size={iconSize} color={p.rim} strokeWidth={2.2} />
      </View>
      <View style={{ position: 'absolute', transform: [{ translateY: -1 }] }} pointerEvents="none">
        <Icon name={shown} size={iconSize} color={p.shine} strokeWidth={2.2} />
      </View>
    </View>
  );
}
