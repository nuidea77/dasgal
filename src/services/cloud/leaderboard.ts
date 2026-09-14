import { LeaderboardEntry, LeaderboardPeriod } from '@/domain/gamification/leaderboard';
import { getSupabase } from './supabase';

const VIEW: Record<LeaderboardPeriod, string> = {
  week: 'leaderboard_week',
  all: 'leaderboard_all',
};

/**
 * Reads the shared board. Returns null when cloud sync is not configured, so
 * the screen can say so rather than showing an empty list. Never throws.
 */
export async function fetchLeaderboard(period: LeaderboardPeriod, limit = 100): Promise<LeaderboardEntry[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from(VIEW[period]).select('id,name,xp,workouts').order('xp', { ascending: false }).limit(limit);
    if (error || !data) return null;
    return data.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? 'Anon'),
      xp: Number(row.xp ?? 0),
      workouts: Number(row.workouts ?? 0),
      streakDays: 0,
    }));
  } catch {
    return null;
  }
}
