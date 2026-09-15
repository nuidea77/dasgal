import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography } from '@/theme';

/** Struck podium medals for the first three places; see assets/ranks. */
const PODIUM: Record<number, number> = {
  1: require('../../assets/ranks/rank-1.png'),
  2: require('../../assets/ranks/rank-2.png'),
  3: require('../../assets/ranks/rank-3.png'),
};

/** The glow behind each podium medal, so the top three read as lit. */
const GLOW: Record<number, string> = {
  1: 'rgba(224,168,46,0.22)',
  2: 'rgba(195,203,221,0.18)',
  3: 'rgba(194,118,58,0.20)',
};

/**
 * A competitor's place: a medal for the podium, a plain numbered disc below it.
 */
export function RankMedal({ rank, size = 38 }: { rank: number; size?: number }) {
  const medal = PODIUM[rank];
  if (!medal) {
    return (
      <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.number}>{rank}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.podium, { width: size, height: size }]}>
      <View style={[styles.glow, { backgroundColor: GLOW[rank], borderRadius: size }]} />
      <Image source={medal} style={{ width: size, height: size }} contentFit="contain" transition={150} />
    </View>
  );
}

const styles = StyleSheet.create({
  podium: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', top: -5, left: -5, right: -5, bottom: -5 },
  disc: { backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  number: { ...typography.numberSm, color: colors.textMuted },
});
