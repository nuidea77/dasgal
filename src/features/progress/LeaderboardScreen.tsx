import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Caption, Card, Chip, Heading, Row } from '@/components/ui';
import { Icon } from '@/components/Icon';
import {
  LeaderboardEntry,
  LeaderboardPeriod,
  RankedEntry,
  hasGapBefore,
  leaderboardWindow,
  rankEntries,
  workoutsSince,
  xpSince,
} from '@/domain/gamification/leaderboard';
import { weekStart } from '@/domain/plan/weekStrip';
import { todayIso } from '@/domain/plan/generator';
import { fetchLeaderboard } from '@/services/cloud/leaderboard';
import { isCloudConfigured } from '@/services/cloud/supabase';
import { format, useT } from '@/i18n';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUserStore } from '@/store/useUserStore';
import { colors, radius, spacing, typography } from '@/theme';

const MEDALS = ['#E0A82E', '#C3CBDD', '#C2763A'];

/** The full board, reachable from the card on the progress tab. */
export function LeaderboardScreen() {
  const t = useT();
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const { rows, me, state, reload, refreshing } = useLeaderboard(period);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.accent} />}
      >
        <Row style={{ gap: spacing.sm }}>
          <Chip label={t.leaderboard.week} selected={period === 'week'} onPress={() => setPeriod('week')} />
          <Chip label={t.leaderboard.allTime} selected={period === 'all'} onPress={() => setPeriod('all')} />
        </Row>

        {me ? (
          <Card style={{ borderColor: colors.accent }}>
            <Caption>{t.leaderboard.yourStanding}</Caption>
            <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <Row style={{ flex: 1, flexWrap: 'nowrap' }}>
                <Text style={styles.myRank}>{state === 'online' ? `#${me.rank}` : '—'}</Text>
                <View style={{ flex: 1 }}>
                  <Body strong numberOfLines={1}>{me.name}</Body>
                  <Caption>{format(t.leaderboard.workoutsCount, { n: me.workouts })}</Caption>
                </View>
              </Row>
              <Text style={styles.myXp}>{me.xp} XP</Text>
            </Row>
          </Card>
        ) : null}

        {state === 'loading' ? <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} /> : null}

        {state === 'offline' ? <OfflineNotice /> : null}

        {state === 'online' ? (
          <View style={{ gap: spacing.sm }}>
            {rows.map((row, i) => (
              <React.Fragment key={row.id}>
                {hasGapBefore(rows, i) ? <Text style={styles.gap}>···</Text> : null}
                <BoardRow row={row} />
              </React.Fragment>
            ))}
            {rows.length === 0 ? <Body muted style={{ textAlign: 'center' }}>{t.leaderboard.empty}</Body> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function BoardRow({ row }: { row: RankedEntry }) {
  const t = useT();
  const medal = MEDALS[row.rank - 1];
  return (
    <View style={[styles.row, row.isMe && styles.rowMe]}>
      <View style={[styles.rankBox, medal ? { backgroundColor: medal } : null]}>
        <Text style={[styles.rank, medal ? { color: '#0B1020' } : null]}>{row.rank}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Body strong numberOfLines={1}>{row.isMe ? `${row.name} · ${t.leaderboard.you}` : row.name}</Body>
        <Caption>{format(t.leaderboard.workoutsCount, { n: row.workouts })}</Caption>
      </View>
      <Text style={styles.xp}>{row.xp}</Text>
      <Text style={styles.xpUnit}>XP</Text>
    </View>
  );
}

function OfflineNotice() {
  const t = useT();
  const update = useSettingsStore((s) => s.update);
  const cloudOn = useSettingsStore((s) => s.cloudSyncEnabled);
  const configured = isCloudConfigured();
  return (
    <Card>
      <Row>
        <Icon name="cpu" size={20} color={colors.textDim} />
        <Heading style={{ flex: 1 }}>{t.leaderboard.offlineTitle}</Heading>
      </Row>
      <Body muted>{configured ? t.leaderboard.offlineBody : t.leaderboard.notConfigured}</Body>
      {configured && !cloudOn ? (
        <Button title={t.leaderboard.enableSync} onPress={() => update({ cloudSyncEnabled: true })} />
      ) : null}
    </Card>
  );
}

type BoardState = 'loading' | 'online' | 'offline';

/**
 * Loads the shared board and always folds in the local user's own totals, so
 * the "your standing" card is correct even before the server has their latest
 * workouts — or when there is no server at all.
 */
function useLeaderboard(period: LeaderboardPeriod) {
  const history = useProgressStore((s) => s.history);
  const streakDays = useProgressStore((s) => s.streakDays);
  const totalXp = useProgressStore((s) => s.xp);
  const deviceId = useUserStore((s) => s.deviceId);
  const name = useUserStore((s) => s.profile?.name ?? '');
  const cloudOn = useSettingsStore((s) => s.cloudSyncEnabled);
  const t = useT();

  const [remote, setRemote] = useState<LeaderboardEntry[] | null>(null);
  const [state, setState] = useState<BoardState>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const mine = useMemo<LeaderboardEntry>(() => {
    const from = period === 'week' ? weekStart(todayIso()) : '0000-01-01';
    return {
      id: deviceId,
      name: name || t.leaderboard.you,
      xp: period === 'week' ? xpSince(history, from) : totalXp,
      workouts: workoutsSince(history, from),
      streakDays,
    };
  }, [period, history, totalXp, streakDays, deviceId, name, t]);

  const load = useCallback(async () => {
    if (!cloudOn) {
      setRemote(null);
      setState('offline');
      return;
    }
    const data = await fetchLeaderboard(period);
    setRemote(data);
    setState(data ? 'online' : 'offline');
  }, [cloudOn, period]);

  useEffect(() => {
    setState('loading');
    void load();
  }, [load]);

  const reload = useCallback(() => {
    setRefreshing(true);
    void load().finally(() => setRefreshing(false));
  }, [load]);

  const ranked = useMemo(() => {
    const others = (remote ?? []).filter((e) => e.id !== deviceId);
    return rankEntries([...others, mine], deviceId);
  }, [remote, mine, deviceId]);

  return {
    rows: leaderboardWindow(ranked, 10, 1),
    me: ranked.find((e) => e.isMe) ?? null,
    state,
    reload,
    refreshing,
  };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  rowMe: { borderColor: colors.accent, backgroundColor: colors.bgElevated },
  rankBox: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  rank: { ...typography.numberSm, color: colors.textMuted },
  xp: { ...typography.numberMd },
  xpUnit: { ...typography.caption, marginLeft: -4 },
  myRank: { ...typography.numberLg, color: colors.accent, fontSize: 30, lineHeight: 34, minWidth: 64 },
  myXp: { ...typography.numberMd, color: colors.accent },
  gap: { ...typography.caption, textAlign: 'center', letterSpacing: 4 },
});
