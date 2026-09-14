import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

const PALETTE = [colors.primary, colors.accent, colors.warning, colors.danger, '#4DA3FF', '#FFFFFF'];

interface Piece {
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotate: number;
  drift: number;
}

/** Full-screen confetti burst built on the core Animated API (no native deps). */
export function Confetti({ count = 90, running = true }: { count?: number; running?: boolean }) {
  const { width, height } = Dimensions.get('window');
  const progress = useRef(new Animated.Value(0)).current;
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        delay: Math.random() * 600,
        duration: 2200 + Math.random() * 1400,
        size: 6 + Math.random() * 8,
        color: PALETTE[i % PALETTE.length]!,
        rotate: Math.random() * 720 - 360,
        drift: (Math.random() - 0.5) * 120,
      })),
    [count, width],
  );

  useEffect(() => {
    if (!running) return;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true }).start();
  }, [progress, running]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => {
        const start = p.delay / 3600;
        const end = Math.min(1, (p.delay + p.duration) / 3600);
        const translateY = progress.interpolate({ inputRange: [0, start, end, 1], outputRange: [-40, -40, height + 40, height + 40] });
        const translateX = progress.interpolate({ inputRange: [0, start, end, 1], outputRange: [0, 0, p.drift, p.drift] });
        const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rotate}deg`] });
        const opacity = progress.interpolate({ inputRange: [0, start, end * 0.9, end, 1], outputRange: [0, 1, 1, 0, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: 0,
              width: p.size,
              height: p.size * 1.6,
              borderRadius: 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
