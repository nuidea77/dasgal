import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { OnboardingScreenProps } from '@/app/navigation/types';
import { Body, Button, Chip, Row, Screen, Title } from '@/components/ui';
import { Sex } from '@/domain/profile/types';
import { useT } from '@/i18n';
import { useOnboardingDraft } from './draft';
import { colors, radius, spacing } from '@/theme';

function Field({ label, value, onChange, keyboardType = 'default' }: { label: string; value: string; onChange: (v: string) => void; keyboardType?: 'default' | 'numeric' }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType={keyboardType} style={styles.input} placeholderTextColor={colors.textDim} />
    </View>
  );
}

export function ProfileFormScreen({ navigation }: OnboardingScreenProps<'ProfileForm'>) {
  const t = useT();
  const { draft, update } = useOnboardingDraft();
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    const age = Number(draft.age);
    const h = Number(draft.heightCm);
    const w = Number(draft.weightKg);
    if (!draft.name.trim() || !(age >= 10 && age <= 100) || !(h >= 100 && h <= 250) || !(w >= 25 && w <= 300)) {
      setError(t.onboarding.validation);
      return;
    }
    setError(null);
    navigation.navigate('Goal');
  };

  return (
    <Screen>
      <Title>{t.onboarding.profileTitle}</Title>
      <Field label={t.onboarding.name} value={draft.name} onChange={(v) => update({ name: v })} />
      <Field label={t.onboarding.age} value={draft.age} onChange={(v) => update({ age: v })} keyboardType="numeric" />
      <View style={styles.field}>
        <Text style={styles.label}>{t.onboarding.sex}</Text>
        <Row>
          {(['male', 'female'] as Sex[]).map((s) => (
            <Chip key={s} label={t.onboarding[s]} selected={draft.sex === s} onPress={() => update({ sex: s })} />
          ))}
        </Row>
      </View>
      <Field label={t.onboarding.height} value={draft.heightCm} onChange={(v) => update({ heightCm: v })} keyboardType="numeric" />
      <Field label={t.onboarding.weight} value={draft.weightKg} onChange={(v) => update({ weightKg: v })} keyboardType="numeric" />
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
});
