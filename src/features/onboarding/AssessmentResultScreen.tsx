import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Card, Row, Screen, Stat, Title } from '@/components/ui';
import { healthyWeightRange } from '@/domain/profile/bmi';
import { useT } from '@/i18n';
import { usePlanStore } from '@/store/usePlanStore';
import { useUserStore } from '@/store/useUserStore';
import { colors, spacing } from '@/theme';

export function AssessmentResultScreen(_: OnboardingScreenProps<'AssessmentResult'>) {
  const t = useT();
  const profile = useUserStore((s) => s.profile);
  const assessment = useUserStore((s) => s.assessment);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const generate = usePlanStore((s) => s.generate);

  if (!profile || !assessment) return null;
  const range = healthyWeightRange(profile.heightCm);
  const categoryColor = assessment.category === 'normal' ? colors.accent : colors.warning;

  const finish = () => {
    generate(profile);
    completeOnboarding();
  };

  return (
    <Screen>
      <Title>{t.onboarding.resultTitle}</Title>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body muted>{t.onboarding.bmi}</Body>
          <Text style={[styles.big, { color: categoryColor }]}>{assessment.bmi}</Text>
        </Row>
        <Body style={{ color: categoryColor, fontWeight: '700' }}>{t.onboarding[`bmi_${assessment.category}` as const]}</Body>
        <Caption>
          {range.min} – {range.max} kg
        </Caption>
      </Card>
      <Card>
        <Row>
          <Stat label={t.onboarding.targetWeight} value={`${assessment.targetWeightKg} kg`} accent />
          <Stat label={t.onboarding.dailyCalories} value={`${assessment.calories.recommended}`} />
        </Row>
        <View style={styles.divider} />
        <Caption>{t.onboarding.macros}</Caption>
        <Row>
          <Stat label="P" value={`${assessment.calories.protein} g`} />
          <Stat label="C" value={`${assessment.calories.carbs} g`} />
          <Stat label="F" value={`${assessment.calories.fat} g`} />
        </Row>
      </Card>
      <Card>
        <Body>
          {t.onboarding[`goal_${profile.goal}` as const]} · {t.onboarding[`level_${profile.level}` as const]}
        </Body>
        <Caption>
          {profile.programDays} {t.common.day.toLowerCase()} · {profile.daysPerWeek}×/7
        </Caption>
      </Card>
      <View style={{ flex: 1 }} />
      <Button title={t.onboarding.generatePlan} size="lg" onPress={finish} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { fontSize: 40, fontWeight: '900' },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.sm },
});
