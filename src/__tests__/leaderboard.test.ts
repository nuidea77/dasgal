import { hasGapBefore, leaderboardWindow, rankEntries, workoutsSince, xpSince } from '@/domain/gamification/leaderboard';
import { WorkoutRecord } from '@/store/types';

const entry = (id: string, xp: number, workouts = 1) => ({ id, name: id.toUpperCase(), xp, workouts, streakDays: 0 });

describe('leaderboard', () => {
  it('ranks by xp and marks the local user', () => {
    const ranked = rankEntries([entry('a', 100), entry('b', 300), entry('c', 200)], 'c');
    expect(ranked.map((e) => e.id)).toEqual(['b', 'c', 'a']);
    expect(ranked.map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(ranked.find((e) => e.isMe)?.id).toBe('c');
  });

  it('gives tied competitors the same rank and skips the next', () => {
    const ranked = rankEntries([entry('a', 100, 2), entry('b', 100, 2), entry('c', 50)], 'a');
    expect(ranked.map((e) => e.rank)).toEqual([1, 1, 3]);
  });

  it('breaks an xp tie by workouts done', () => {
    const ranked = rankEntries([entry('a', 100, 1), entry('b', 100, 4)], 'a');
    expect(ranked[0]?.id).toBe('b');
  });

  it('shows the top rows plus the user when they are further down', () => {
    const many = Array.from({ length: 40 }, (_, i) => entry(`u${i}`, 1000 - i * 10));
    const ranked = rankEntries(many, 'u25');
    const rows = leaderboardWindow(ranked, 5, 1);
    expect(rows.slice(0, 5).map((e) => e.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(rows.some((e) => e.isMe)).toBe(true);
    expect(rows.filter((e) => e.isMe)).toHaveLength(1);
    expect(hasGapBefore(rows, 5)).toBe(true);
  });

  it('returns everyone when the board is short', () => {
    const ranked = rankEntries([entry('a', 10), entry('b', 20)], 'a');
    expect(leaderboardWindow(ranked, 10)).toHaveLength(2);
  });

  it('sums only the period being ranked', () => {
    const history = [
      { date: '2026-09-01', xp: 50 },
      { date: '2026-09-08', xp: 70 },
      { date: '2026-09-10', xp: 30 },
    ] as WorkoutRecord[];
    expect(xpSince(history, '2026-09-07')).toBe(100);
    expect(workoutsSince(history, '2026-09-07')).toBe(2);
  });
});
