import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Caption, Row } from '@/components/ui';
import { OnboardingStep } from './OnboardingStep';
import { TOTAL_STEPS } from './steps';
import { Icon, IconName } from '@/components/Icon';
import { paceOptions } from '@/domain/profile/timeline';
import { dailyBurnTarget, todayIso } from '@/domain/plan/generator';
import { Pace } from '@/domain/profile/types';
import { format, useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import { useOnboardingDraft } from './draft';

const ICONS: Record<Pace, IconName> = { easy: 'heart', moderate: 'activity', hard: 'flame' };


export function PaceScreen({ navigation }: OnboardingScreenProps<'Pace'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  const weight = Number(draft.weightKg);
  const target = Number(draft.targetWeightKg);
  // Sessions are sized to burn 300–600 kcal (pace-dependent), so the timeline uses that target.
  const options = useMemo(() => paceOptions(weight, target, draft.goal, (pace) => dailyBurnTarget(pace, 4, 'moderate'), todayIso()), [weight, target, draft.goal]);

  const choose = (pace: Pace) => {
    const opt = options.find((o) => o.pace === pace)!;
    update({ pace, programDays: opt.programDays, daysPerWeek: opt.daysPerWeek });
  };

  return (
    <OnboardingStep
      title={t.onboarding.paceTitle}
      subtitle={t.onboarding.paceSubtitle}
      step={8}
      total={TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      onNext={() => {
        choose(draft.pace);
        navigation.navigate('ExercisePick');
      }}
    >
      {options.map((o) => {
        const selected = draft.pace === o.pace;
        return (
          <Pressable key={o.pace} onPress={() => choose(o.pace)} style={[styles.card, selected && styles.cardSelected]}>
            <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <Row>
                <Icon name={ICONS[o.pace]} color={selected ? colors.accent : colors.textMuted} />
                <Text style={styles.name}>{t.onboarding[`pace_${o.pace}` as const]}</Text>
              </Row>
              <Text style={[styles.weeks, selected && { color: colors.accent }]}>
                {o.weeks === 0 ? t.onboarding.paceMaintain : format(t.onboarding.paceWeeks, { weeks: o.weeks })}
              </Text>
            </Row>
            {o.weeks > 0 ? (
              <Caption>
                {format(t.onboarding.timelineDate, { date: o.targetDate })} · {format(t.onboarding.paceRate, { kg: o.weeklyRateKg })}
              </Caption>
            ) : null}
            <Row>
              <Caption>{format(t.onboarding.paceDays, { n: o.daysPerWeek })}</Caption>
              <Caption>· {format(t.onboarding.paceKcal, { kcal: o.calorieDelta > 0 ? `+${o.calorieDelta}` : o.calorieDelta })}</Caption>
              <Caption>· {format(t.onboarding.paceBurn, { kcal: dailyBurnTarget(o.pace, 4, 'moderate') })}</Caption>
            </Row>
          </Pressable>
        );
      })}
      <Body muted style={{ textAlign: 'center' }}>{format(t.onboarding.deltaKg, { kg: Math.round((target - weight) * 10) / 10 })}</Body>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 2, borderColor: colors.cardBorder, gap: 6 },
  cardSelected: { borderColor: colors.accent, backgroundColor: '#163D33' },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  weeks: { color: colors.text, fontSize: 18, fontWeight: '800' },
});
