import React, { useEffect } from 'react';
import { Alert, Switch, View } from 'react-native';
import Constants from 'expo-constants';
import { Body, Button, Caption, Card, Chip, Row, Screen, Subheading, Title } from '@/components/ui';
import { useI18nStore, useT } from '@/i18n';
import { scheduleDailyReminder, scheduleMotivation } from '@/services/notifications/scheduler';
import { isCloudConfigured } from '@/services/cloud/supabase';
import { usePlanStore } from '@/store/usePlanStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUserStore } from '@/store/useUserStore';
import { colors } from '@/theme';

const HOURS = [6, 7, 8, 12, 17, 18, 19, 20, 21];

export function SettingsScreen() {
  const t = useT();
  const s = useSettingsStore();
  const setLanguage = useI18nStore((st) => st.setLanguage);
  const completed = usePlanStore((st) => st.completedDates);

  useEffect(() => {
    void scheduleDailyReminder(s.reminderEnabled, s.reminderHour, s.reminderMinute);
    void scheduleMotivation(s.motivationEnabled, s.reminderHour, s.reminderMinute, new Set(Object.keys(completed)));
  }, [s.reminderEnabled, s.reminderHour, s.reminderMinute, s.motivationEnabled, completed, s.language]);

  const reset = () => {
    Alert.alert(t.settings.resetProfile, t.settings.resetConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.resetProfile,
        style: 'destructive',
        onPress: () => {
          useProgressStore.getState().reset();
          usePlanStore.getState().reset();
          useUserStore.getState().reset();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Title>{t.settings.title}</Title>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>{t.settings.reminder}</Body>
          <Switch value={s.reminderEnabled} onValueChange={(v) => s.update({ reminderEnabled: v })} trackColor={{ true: colors.primary }} />
        </Row>
        <Caption>{t.settings.reminderTime}</Caption>
        <Row>
          {HOURS.map((h) => (
            <Chip key={h} label={`${String(h).padStart(2, '0')}:00`} selected={s.reminderHour === h} onPress={() => s.update({ reminderHour: h, reminderMinute: 0 })} />
          ))}
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>{t.settings.motivation}</Body>
          <Switch value={s.motivationEnabled} onValueChange={(v) => s.update({ motivationEnabled: v })} trackColor={{ true: colors.primary }} />
        </Row>
      </Card>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>{t.settings.voice}</Body>
          <Switch value={s.voiceEnabled} onValueChange={(v) => s.update({ voiceEnabled: v })} trackColor={{ true: colors.primary }} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>{t.settings.showSkeleton}</Body>
          <Switch value={s.showSkeleton} onValueChange={(v) => s.update({ showSkeleton: v })} trackColor={{ true: colors.primary }} />
        </Row>
        <Caption>{t.settings.camera}</Caption>
        <Row>
          <Chip label={t.settings.cameraFront} selected={s.cameraPosition === 'front'} onPress={() => s.update({ cameraPosition: 'front' })} />
          <Chip label={t.settings.cameraBack} selected={s.cameraPosition === 'back'} onPress={() => s.update({ cameraPosition: 'back' })} />
        </Row>
        <Caption>{t.settings.language}</Caption>
        <Row>
          <Chip label="Монгол" selected={s.language === 'mn'} onPress={() => { s.update({ language: 'mn' }); setLanguage('mn'); }} />
          <Chip label="English" selected={s.language === 'en'} onPress={() => { s.update({ language: 'en' }); setLanguage('en'); }} />
        </Row>
      </Card>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>{t.settings.cloudSync}</Body>
          <Switch value={s.cloudSyncEnabled && isCloudConfigured()} disabled={!isCloudConfigured()} onValueChange={(v) => s.update({ cloudSyncEnabled: v })} trackColor={{ true: colors.primary }} />
        </Row>
        <Caption>{t.settings.cloudSyncHint}</Caption>
      </Card>
      <Card>
        <Subheading>🔒 {t.settings.privacyTitle}</Subheading>
        <Caption>{t.settings.privacyBody}</Caption>
      </Card>
      <View style={{ flex: 1 }} />
      <Button title={t.settings.resetProfile} variant="danger" onPress={reset} />
      <Caption style={{ textAlign: 'center' }}>
        {t.settings.version} {Constants.expoConfig?.version ?? '1.0.0'}
      </Caption>
    </Screen>
  );
}
