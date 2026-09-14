import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Row, Screen, Title } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { paceOptions } from '@/domain/profile/timeline';
import { todayIso } from '@/domain/plan/generator';
import { Pace } from '@/domain/profile/types';
import { format, useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import { useOnboardingDraft } from './draft';

const ICONS: Record<Pace, IconName> = { easy: 'heart', moderate: 'activity', hard: 'flame' };

/** Rough calories burned per session, used only to rank the three pace timelines. */
function sessionKcal(weightKg: number, level: string): number {
  const base = level === 'beginner' ? 110 : level === 'intermediate' ? 150 : 190;
  return Math.round(base * (weightKg / 70));
}

export function PaceScreen({ navigation }: OnboardingScreenProps<'Pace'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  const weight = Number(draft.weightKg);
  const target = Number(draft.targetWeightKg);
  const options = useMemo(() => paceOptions(weight, target, draft.goal, sessionKcal(weight, draft.level), todayIso()), [weight, target, draft.goal, draft.level]);

  const choose = (pace: Pace) => {
    const opt = options.find((o) => o.pace === pace)!;
    update({ pace, programDays: opt.programDays, daysPerWeek: opt.daysPerWeek });
  };

  return (
    <Screen>
      <Title>{t.onboarding.paceTitle}</Title>
      <Caption>{t.onboarding.paceSubtitle}</Caption>
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
            </Row>
          </Pressable>
        );
      })}
      <Body muted>{format(t.onboarding.deltaKg, { kg: Math.round((target - weight) * 10) / 10 })}</Body>
      <View style={{ flex: 1 }} />
      <Button
        title={t.common.next}
        size="lg"
        onPress={() => {
          choose(draft.pace);
          navigation.navigate('ExercisePick');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 2, borderColor: colors.cardBorder, gap: 6 },
  cardSelected: { borderColor: colors.accent, backgroundColor: '#163D33' },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  weeks: { color: colors.text, fontSize: 18, fontWeight: '800' },
});
