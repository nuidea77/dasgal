import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Button, Caption, Screen, Subheading, Title } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { WheelPicker } from '@/components/WheelPicker';
import { calculateBmi } from '@/domain/profile/bmi';
import { Sex } from '@/domain/profile/types';
import { useT } from '@/i18n';
import { useOnboardingDraft } from './draft';
import { colors, radius, spacing } from '@/theme';

const SEXES: Array<{ id: Sex; icon: IconName }> = [
  { id: 'male', icon: 'male' },
  { id: 'female', icon: 'female' },
];

export function ProfileFormScreen({ navigation }: OnboardingScreenProps<'ProfileForm'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  const [error, setError] = useState<string | null>(null);
  const bmi = calculateBmi(draft.weightKg, draft.heightCm);

  const next = () => {
    if (!draft.name.trim()) {
      setError(t.onboarding.validation);
      return;
    }
    setError(null);
    navigation.navigate('Goal');
  };

  return (
    <Screen>
      <Title>{t.onboarding.profileTitle}</Title>
      <Caption>{t.onboarding.profileSubtitle}</Caption>

      <View style={styles.field}>
        <Text style={styles.label}>{t.onboarding.name}</Text>
        <TextInput
          value={draft.name}
          onChangeText={(v) => update({ name: v })}
          style={styles.input}
          placeholder={t.onboarding.namePlaceholder}
          placeholderTextColor={colors.textDim}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t.onboarding.sex}</Text>
        <View style={styles.sexRow}>
          {SEXES.map((s) => {
            const on = draft.sex === s.id;
            return (
              <Pressable key={s.id} onPress={() => update({ sex: s.id })} style={[styles.sexCard, on && styles.sexCardOn]}>
                <View style={[styles.sexIcon, on && { backgroundColor: colors.primary }]}>
                  <Icon name={s.icon} size={30} color={on ? colors.white : colors.textMuted} strokeWidth={2.2} />
                </View>
                <Text style={[styles.sexLabel, on && { color: colors.text }]}>{t.onboarding[s.id]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Subheading>{t.onboarding.age}</Subheading>
      <WheelPicker min={12} max={90} value={draft.age} onChange={(v) => update({ age: v })} unit={t.onboarding.ageUnit} accent={colors.primary} />

      <Subheading>{t.onboarding.height}</Subheading>
      <WheelPicker min={120} max={220} value={draft.heightCm} onChange={(v) => update({ heightCm: v })} unit="см" accent={colors.primary} />

      <Subheading>{t.onboarding.weight}</Subheading>
      <WheelPicker
        min={30}
        max={200}
        value={draft.weightKg}
        onChange={(v) => update({ weightKg: v })}
        unit="кг"
        hint={bmi > 0 ? `${t.onboarding.bmi}: ${bmi}` : undefined}
        accent={colors.primary}
      />

      {error ? <Body style={{ color: colors.danger }}>{error}</Body> : null}
      <View style={{ flex: 1 }} />
      <Button title={t.common.next} size="lg" onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { color: colors.textMuted, fontWeight: '600' },
  input: { backgroundColor: colors.bgElevated, color: colors.text, borderRadius: radius.sm, padding: spacing.md, fontSize: 17, borderWidth: 1, borderColor: colors.cardBorder },
  sexRow: { flexDirection: 'row', gap: spacing.sm },
  sexCard: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 2, borderColor: colors.cardBorder },
  sexCardOn: { borderColor: colors.primary, backgroundColor: '#251F4D' },
  sexIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  sexLabel: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
});
