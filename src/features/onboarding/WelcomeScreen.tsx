import React from 'react';
import { StyleSheet, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Screen, Title } from '@/components/ui';
import { StickFigureDemo } from '@/components/StickFigureDemo';
import { Icon } from '@/components/Icon';
import { getExercise } from '@/domain/plan/exercises';
import { useT } from '@/i18n';
import { colors, spacing } from '@/theme';

export function WelcomeScreen({ navigation }: OnboardingScreenProps<'Welcome'>) {
  const t = useT();
  const squat = getExercise('squat');
  return (
    <Screen>
      <View style={styles.hero}>
        <Title style={styles.title}>{t.onboarding.welcomeTitle}</Title>
        <Body muted style={{ textAlign: 'center' }}>{t.onboarding.welcomeSubtitle}</Body>
      </View>
      <StickFigureDemo rest={squat.demo.rest} active={squat.demo.active} size={240} />
      <View style={styles.privacy}>
        <Icon name="lock" color={colors.accent} />
        <Caption style={{ flex: 1 }}>{t.onboarding.privacyNote}</Caption>
      </View>
      <View style={{ flex: 1 }} />
      <Button title={t.common.start} size="lg" onPress={() => navigation.navigate('ProfileForm')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  title: { fontSize: 44, color: colors.primary },
  privacy: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: colors.bgElevated, padding: spacing.md, borderRadius: 16 },
});
