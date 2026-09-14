import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AwardStyle, LOCKED_STYLE } from '@/domain/gamification/awards';
import { Icon } from '@/components/Icon';
import { MEDAL_IMAGES } from '@/components/medalAssets';

interface Props {
  badgeId: string;
  style: AwardStyle;
  size?: number;
  /** Struck but not yet earned: dimmed, behind a padlock. */
  locked?: boolean;
}

/**
 * An award badge. Earned awards show their enamel-and-silver artwork; unearned
 * ones dim to a silhouette under a padlock, the way the OS fitness apps do it.
 */
export function AwardMedal({ badgeId, style, size = 220, locked = false }: Props) {
  const source = MEDAL_IMAGES[badgeId] ?? MEDAL_IMAGES.first_workout;
  const s = locked ? LOCKED_STYLE : style;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Halo in the badge's own enamel colour, so it reads as lit rather than pasted on. */}
      <Svg width={size * 1.4} height={size * 1.4} style={styles.halo} pointerEvents="none">
        <Defs>
          <RadialGradient id={`halo-${badgeId}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0.35" stopColor={s.accent} stopOpacity={locked ? '0.1' : '0.34'} />
            <Stop offset="1" stopColor={s.accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size * 0.7} cy={size * 0.7} r={size * 0.69} fill={`url(#halo-${badgeId})`} />
      </Svg>

      <Image
        source={source}
        style={{ width: size, height: size, opacity: locked ? 0.22 : 1 }}
        contentFit="contain"
        transition={200}
      />

      {locked ? (
        <View style={styles.lock} pointerEvents="none">
          <Icon name="lock" size={size * 0.24} color="#8A93B4" strokeWidth={2} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute' },
  lock: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
