import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Card, Row, Screen, Stat, Subheading, Title } from '@/components/ui';
import { healthyWeightRange } from '@/domain/profile/bmi';
import { estimateTargetTimeline } from '@/domain/profile/timeline';
import { estimateWeeklyCalories, generatePlan, todayIso } from '@/domain/plan/generator';
import { Icon } from '@/components/Icon';
import { format } from '@/i18n';
import { useT } from '@/i18n';
import { usePlanStore } from '@/store/usePlanStore';
import { useUserStore } from '@/store/useUserStore';
import { colors, fonts, spacing, typography } from '@/theme';

export function AssessmentResultScreen({ navigation }: OnboardingScreenProps<'AssessmentResult'>) {
  const t = useT();
  const profile = useUserStore((s) => s.profile);
  const assessment = useUserStore((s) => s.assessment);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const generate = usePlanStore((s) => s.generate);

  const timeline = useMemo(() => {
    if (!profile || !assessment) return null;
    const preview = generatePlan(profile, { seed: 1, startDate: todayIso() });
    const weeklyBurn = estimateWeeklyCalories(preview, profile.weightKg);
    const perSession = Math.round(weeklyBurn / Math.max(1, profile.daysPerWeek));
    return { ...estimateTargetTimeline(profile.weightKg, assessment.targetWeightKg, profile.goal, profile.pace, perSession, todayIso()), weeklyBurn };
  }, [profile, assessment]);

  if (!profile || !assessment || !timeline) return null;
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
        <Body strong style={{ color: categoryColor }}>{t.onboarding[`bmi_${assessment.category}` as const]}</Body>
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
      <Card style={{ borderColor: colors.accent }}>
        <Row>
          <Icon name="trending" color={colors.accent} size={20} />
          <Subheading>{t.onboarding.timelineTitle}</Subheading>
        </Row>
        {timeline.weeks === 0 ? (
          <Body muted>{t.onboarding.alreadyAtTarget}</Body>
        ) : (
          <>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.weeks}>{format(t.onboarding.timelineWeeks, { weeks: timeline.weeks })}</Text>
              <Caption>{format(t.onboarding.timelineDate, { date: timeline.targetDate })}</Caption>
            </Row>
            <Caption>
              {format(t.onboarding.deltaKg, { kg: timeline.deltaKg > 0 ? `+${timeline.deltaKg}` : timeline.deltaKg })} · {format(t.onboarding.weeklyRate, { kg: timeline.weeklyRateKg })}
            </Caption>
            <Caption>{format(t.onboarding.workoutBurn, { kcal: timeline.weeklyBurn })}</Caption>
            <Body strong style={{ color: colors.accent }}>
              {t.onboarding[`pace_${profile.pace}` as const]} · {format(t.onboarding.suggestedProgram, { days: profile.programDays, perWeek: profile.daysPerWeek })}
            </Body>
            <Button title={t.onboarding.changePace} variant="ghost" onPress={() => navigation.navigate('Pace')} />
          </>
        )}
      </Card>
      <Card>
        <Body>
          {t.onboarding[`goal_${profile.goal}` as const]} · {t.onboarding[`level_${profile.level}` as const]}
        </Body>
        <Caption>
          {profile.programDays} {t.common.day.toLowerCase()} · {profile.daysPerWeek}×/7 · {profile.preferredExercises.length} {t.common.exercises}
        </Caption>
      </Card>
      <View style={{ flex: 1 }} />
      <Button title={t.onboarding.generatePlan} size="lg" onPress={finish} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { ...typography.numberLg, fontSize: 40, lineHeight: 44 },
  weeks: { ...typography.numberLg, fontSize: 26, lineHeight: 30, fontFamily: fonts.bold },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.sm },
});
