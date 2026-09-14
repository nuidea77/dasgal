import React from 'react';
import { StyleProp, StyleSheet, View } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { colors, radius } from '@/theme';

/**
 * Bundled demonstration photos (generated with Higgsfield Soul 2.0), keyed by exercise id.
 * Static `require` calls are needed so Metro bundles them for offline use.
 */
const IMAGES: Record<string, number> = {
  squat: require('../../assets/exercises/squat.jpg'),
  pushup: require('../../assets/exercises/pushup.jpg'),
  knee_pushup: require('../../assets/exercises/knee_pushup.jpg'),
  lunge: require('../../assets/exercises/lunge.jpg'),
  situp: require('../../assets/exercises/situp.jpg'),
  jumping_jack: require('../../assets/exercises/jumping_jack.jpg'),
  glute_bridge: require('../../assets/exercises/glute_bridge.jpg'),
  high_knees: require('../../assets/exercises/high_knees.jpg'),
  plank: require('../../assets/exercises/plank.jpg'),
  wall_sit: require('../../assets/exercises/wall_sit.jpg'),
  mountain_climber: require('../../assets/exercises/mountain_climber.jpg'),
  burpee: require('../../assets/exercises/burpee.jpg'),
};

export function hasExerciseImage(exerciseId: string): boolean {
  return exerciseId in IMAGES;
}

export function ExerciseImage({ exerciseId, style }: { exerciseId: string; style?: StyleProp<ImageStyle> }) {
  const src = IMAGES[exerciseId];
  if (!src) return null;
  return <Image source={src} style={[styles.image, style]} contentFit="cover" transition={200} />;
}

/** Small rounded thumbnail for list rows. */
export function ExerciseThumb({ exerciseId, size = 56 }: { exerciseId: string; size?: number }) {
  const src = IMAGES[exerciseId];
  return (
    <View style={[styles.thumb, { width: size, height: size, borderRadius: size / 4 }]}>
      {src ? <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.bgElevated },
  thumb: { backgroundColor: colors.bgElevated, overflow: 'hidden' },
});
