import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

/** Small segmented control, e.g. cm / ft or kg / lb. */
export function UnitToggle<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)} style={[styles.seg, on && styles.segOn]}>
            <Text style={[styles.text, on && styles.textOn]}>{o.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignSelf: 'center', backgroundColor: colors.card, borderRadius: radius.pill, padding: 4, gap: 4 },
  seg: { paddingVertical: 8, paddingHorizontal: 22, borderRadius: radius.pill },
  segOn: { backgroundColor: colors.primary },
  text: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  textOn: { color: colors.white },
});
