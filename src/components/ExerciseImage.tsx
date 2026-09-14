import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { colors, radius } from '@/theme';
import { EXERCISE_GIFS, EXERCISE_PHOTOS } from './exerciseAssets';

export function hasExerciseImage(exerciseId: string): boolean {
  return exerciseId in EXERCISE_PHOTOS;
}

export function hasExerciseGif(exerciseId: string): boolean {
  return exerciseId in EXERCISE_GIFS;
}

/** Large demonstration image: animated GIF when available, otherwise the still photo. */
export function ExerciseImage({ exerciseId, style, preferGif = true }: { exerciseId: string; style?: StyleProp<ImageStyle>; preferGif?: boolean }) {
  const src = (preferGif && EXERCISE_GIFS[exerciseId]) || EXERCISE_PHOTOS[exerciseId];
  if (!src) return null;
  return <Image source={src} style={[styles.image, style]} contentFit="cover" transition={200} autoplay />;
}

/**
 * Rounded thumbnail (still photo). With `size` it is a fixed square for list
 * rows; without one it fills the parent's content width, so it can never spill
 * out of a card's padding.
 */
export function ExerciseThumb({ exerciseId, size, style }: { exerciseId: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const src = EXERCISE_PHOTOS[exerciseId];
  const box: ViewStyle =
    size === undefined
      ? { width: '100%', aspectRatio: 1, borderRadius: radius.md }
      : { width: size, height: size, borderRadius: size / 4 };
  return (
    <View style={[styles.thumb, box, style]}>
      {src ? <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.bgElevated },
  thumb: { backgroundColor: colors.bgElevated, overflow: 'hidden' },
});
