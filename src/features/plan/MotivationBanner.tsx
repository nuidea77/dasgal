import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { MotivationContext, MotivationTone, pickMotivation } from '@/domain/gamification/motivation';
import { format, useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

const TONE_ICON: Record<MotivationTone, IconName> = {
  streak: 'flame',
  comeback: 'trending',
  rest: 'moon',
  done: 'check',
  final_push: 'target',
  start: 'bolt',
  daily: 'sparkles',
};

const TONE_COLOR: Record<MotivationTone, string> = {
  streak: colors.warning,
  comeback: colors.primary,
  rest: colors.textMuted,
  done: colors.accent,
  final_push: colors.warning,
  start: colors.primary,
  daily: colors.accent,
};

/** One motivating line chosen for today's situation (streak, comeback, rest day, final push...). */
export function MotivationBanner({ context, date }: { context: MotivationContext; date: string }) {
  const t = useT();
  const pick = pickMotivation(context, date);
  const list = t.motivation[pick.tone] as readonly string[];
  const raw = list[pick.index] ?? list[0] ?? '';
  const text = format(raw, { n: context.streakDays, n1: context.streakDays + 1 });
  const color = TONE_COLOR[pick.tone];
  return (
    <View style={[styles.wrap, { borderColor: color }]}>
      <View style={[styles.iconBox, { backgroundColor: `${color}22` }]}>
        <Icon name={TONE_ICON[pick.tone]} size={18} color={color} />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, paddingRight: spacing.md, backgroundColor: colors.bgElevated, borderRadius: radius.md, borderLeftWidth: 3 },
  iconBox: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', lineHeight: 19 },
});
