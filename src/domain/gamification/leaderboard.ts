import { WorkoutRecord } from '@/store/types';

/** One competitor's totals for the period being ranked. */
export interface LeaderboardEntry {
  /** Pseudonymous id; the local user's own id marks their row. */
  id: string;
  name: string;
  xp: number;
  workouts: number;
  streakDays: number;
}

export interface RankedEntry extends LeaderboardEntry {
  /** 1-based; tied scores share a rank (1, 2, 2, 4). */
  rank: number;
  isMe: boolean;
}

export type LeaderboardPeriod = 'week' | 'all';

/**
 * Sorts by XP, then by workouts, then by name so the order is stable across
 * refreshes, and assigns competition ranks (ties share a place).
 */
export function rankEntries(entries: LeaderboardEntry[], meId: string): RankedEntry[] {
  const sorted = [...entries].sort(
    (a, b) => b.xp - a.xp || b.workouts - a.workouts || a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
  let rank = 0;
  let lastXp: number | null = null;
  let lastWorkouts: number | null = null;
  return sorted.map((e, i) => {
    if (e.xp !== lastXp || e.workouts !== lastWorkouts) {
      rank = i + 1;
      lastXp = e.xp;
      lastWorkouts = e.workouts;
    }
    return { ...e, rank, isMe: e.id === meId };
  });
}

/**
 * The rows worth showing: the top `topCount`, plus a window around the local
 * user when they sit outside it. Returns them in rank order with no repeats.
 */
export function leaderboardWindow(ranked: RankedEntry[], topCount = 10, around = 1): RankedEntry[] {
  if (ranked.length <= topCount) return ranked;
  const top = ranked.slice(0, topCount);
  const meIndex = ranked.findIndex((e) => e.isMe);
  if (meIndex < 0 || meIndex < topCount) return top;
  const from = Math.max(topCount, meIndex - around);
  const to = Math.min(ranked.length, meIndex + around + 1);
  return [...top, ...ranked.slice(from, to)];
}

/** True when a gap was skipped between two adjacent rows, so the UI can show a divider. */
export function hasGapBefore(rows: RankedEntry[], index: number): boolean {
  const prev = rows[index - 1];
  const row = rows[index];
  if (!prev || !row) return false;
  return row.rank > prev.rank + 1;
}

/** XP earned from workouts dated on or after `fromIso`. */
export function xpSince(history: WorkoutRecord[], fromIso: string): number {
  return history.reduce((sum, r) => (r.date >= fromIso ? sum + r.xp : sum), 0);
}

export function workoutsSince(history: WorkoutRecord[], fromIso: string): number {
  return history.reduce((n, r) => (r.date >= fromIso ? n + 1 : n), 0);
}
