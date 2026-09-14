import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Screen, Title } from '@/components/ui';
import { StickFigureDemo } from '@/components/StickFigureDemo';
import { Icon, IconName } from '@/components/Icon';
import { getExercise } from '@/domain/plan/exercises';
import { useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

const BULLETS: Array<{ key: 'welcomeBullet1' | 'welcomeBullet2' | 'welcomeBullet3'; icon: IconName }> = [
  { key: 'welcomeBullet1', icon: 'cpu' },
  { key: 'welcomeBullet2', icon: 'target' },
  { key: 'welcomeBullet3', icon: 'award' },
];

export function WelcomeScreen({ navigation }: OnboardingScreenProps<'Welcome'>) {
  const t = useT();
  const squat = getExercise('squat');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [fade]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#151B3A', colors.bg]} style={StyleSheet.absoluteFill} />
      <Screen>
        <View style={styles.hero}>
          <Title style={styles.title}>{t.onboarding.welcomeTitle}</Title>
          <Text style={styles.tagline}>{t.onboarding.welcomeTagline}</Text>
          <Body muted style={{ textAlign: 'center' }}>{t.onboarding.welcomeSubtitle}</Body>
        </View>
        <StickFigureDemo rest={squat.demo.rest} active={squat.demo.active} size={200} />
        <Animated.View style={{ gap: spacing.sm, opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          {BULLETS.map((b) => (
            <View key={b.key} style={styles.bullet}>
              <View style={styles.bulletIcon}>
                <Icon name={b.icon} size={18} color={colors.accent} />
              </View>
              <Body style={{ flex: 1, fontSize: 15 }}>{t.onboarding[b.key]}</Body>
            </View>
          ))}
        </Animated.View>
        <View style={styles.privacy}>
          <Icon name="lock" color={colors.accent} size={18} />
          <Caption style={{ flex: 1 }}>{t.onboarding.privacyNote}</Caption>
        </View>
        <View style={{ flex: 1 }} />
        <Button title={t.common.start} size="lg" onPress={() => navigation.navigate('Sex')} />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  title: { fontSize: 46, color: colors.primary, letterSpacing: -1 },
  tagline: { color: colors.accent, fontSize: 17, fontWeight: '800', marginBottom: 2 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder },
  bulletIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  privacy: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingHorizontal: spacing.sm },
});
