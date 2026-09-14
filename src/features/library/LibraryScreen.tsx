import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { Caption, Screen, Subheading, Title } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ExerciseThumb } from '@/components/ExerciseImage';
import { exercisesByMuscle, MUSCLE_GROUPS } from '@/domain/plan/exercises';
import { format, useT } from '@/i18n';
import { useUserStore } from '@/store/useUserStore';
import { colors, radius, spacing } from '@/theme';

/** Browsable exercise library grouped by muscle (5+ exercises per group). */
export function LibraryScreen() {
  const t = useT();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const weightKg = useUserStore((s) => s.profile?.weightKg ?? 70);

  return (
    <Screen>
      <Title>{t.library.title}</Title>
      <Caption>{t.library.subtitle}</Caption>
      {MUSCLE_GROUPS.map((group) => {
        const list = exercisesByMuscle(group);
        return (
          <View key={group} style={{ gap: spacing.sm }}>
            <View style={styles.header}>
              <Subheading>{t.muscles[group]}</Subheading>
              <Caption>{format(t.library.count, { n: list.length })}</Caption>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {list.map((ex) => {
                const kcal = Math.round(ex.kcalPerUnit * (weightKg / 70) * 100) / 100;
                return (
                  <Pressable key={ex.id} onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })} style={styles.card}>
                    <ExerciseThumb exerciseId={ex.id} size={140} />
                    <Text style={styles.name} numberOfLines={2}>{t.exercises[ex.id as keyof typeof t.exercises]?.name ?? ex.id}</Text>
                    <View style={styles.meta}>
                      <Icon name={ex.countingMode === 'timed' ? 'timer' : 'cpu'} size={13} color={colors.textDim} />
                      <Text style={styles.metaText}>
                        {kcal} {t.common.kcal}/{ex.countingMode === 'reps_ai' ? t.library.perRep : t.library.perSecond}
                      </Text>
                    </View>
                    <View style={styles.meta}>
                      {[1, 2, 3].map((i) => (
                        <Icon key={i} name="star" size={11} color={i <= ex.difficulty ? colors.warning : colors.cardBorder} />
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  card: { width: 140, gap: 4, backgroundColor: colors.card, borderRadius: radius.md, padding: 6, borderWidth: 1, borderColor: colors.cardBorder },
  name: { fontSize: 14, fontWeight: '700', minHeight: 36, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textDim, fontSize: 11 },
});
