import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { MetalPalette } from '@/domain/gamification/awards';
import { Icon } from '@/components/Icon';
import { MEDAL_IMAGES } from '@/components/medalAssets';

/** Palette used for an award that has not been earned yet. */
export const LOCKED_METAL: MetalPalette = {
  rim: '#222A45', dark: '#39425F', base: '#4B5474', light: '#6B7394', shine: '#8A93B4', glow: '#5A6486', text: '#9AA3C2',
};

interface Props {
  badgeId: string;
  palette: MetalPalette;
  size?: number;
  /** Struck but not yet earned: dimmed, behind a padlock. */
  locked?: boolean;
}

/**
 * An award medal. Earned awards show their struck-metal artwork; unearned ones
 * are dimmed to a silhouette under a padlock, the way the OS fitness apps do it.
 */
export function AwardMedal({ badgeId, palette, size = 220, locked = false }: Props) {
  const source = MEDAL_IMAGES[badgeId] ?? MEDAL_IMAGES.first_workout;
  const p = locked ? LOCKED_METAL : palette;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Soft halo in the medal's own metal, so it reads as lit rather than pasted on. */}
      <Svg width={size * 1.3} height={size * 1.3} style={styles.halo} pointerEvents="none">
        <Defs>
          <RadialGradient id={`halo-${badgeId}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0.45" stopColor={p.glow} stopOpacity={locked ? '0.12' : '0.3'} />
            <Stop offset="1" stopColor={p.glow} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size * 0.65} cy={size * 0.65} r={size * 0.64} fill={`url(#halo-${badgeId})`} />
      </Svg>

      <Image
        source={source}
        style={{ width: size, height: size, opacity: locked ? 0.22 : 1 }}
        contentFit="contain"
        transition={200}
      />

      {locked ? (
        <View style={styles.lock} pointerEvents="none">
          <Icon name="lock" size={size * 0.24} color={LOCKED_METAL.shine} strokeWidth={2} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute' },
  lock: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
