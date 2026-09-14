import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, radius } from '@/theme';
import { EXERCISE_PHOTOS, EXERCISE_VIDEOS } from './exerciseAssets';

/**
 * GIF-style looping demo: a tiny silent H.264 clip (≈70 KB) that autoplays and loops.
 * Bundled with the app, so it works offline; hardware decoded, unlike a multi-MB GIF.
 * The still photo sits underneath as a poster until the first frame is ready.
 */
export function ExerciseVideo({ exerciseId, style }: { exerciseId: string; style?: StyleProp<ViewStyle> }) {
  const source = EXERCISE_VIDEOS[exerciseId];
  const poster = EXERCISE_PHOTOS[exerciseId];
  const player = useVideoPlayer(source ?? null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  if (!source) return null;
  return (
    <View style={[styles.box, style]}>
      {poster ? <Image source={poster} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
}

export function hasExerciseVideo(exerciseId: string): boolean {
  return exerciseId in EXERCISE_VIDEOS;
}

const styles = StyleSheet.create({
  box: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.bgElevated, overflow: 'hidden' },
});
