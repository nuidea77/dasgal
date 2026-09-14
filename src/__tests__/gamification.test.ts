import { newlyEarnedBadges } from '@/domain/gamification/badges';
import { levelForXp, levelProgress, xpForLevel, xpForWorkout } from '@/domain/gamification/levels';
import { computeStreak, missedScheduledDays } from '@/domain/gamification/streak';

describe('levels', () => {
  it('level thresholds grow and round-trip', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBeGreaterThan(xpForLevel(2));
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    const lp = levelProgress(150);
    expect(lp.level).toBe(2);
    expect(lp.current).toBe(50);
    expect(lp.ratio).toBeGreaterThan(0);
  });
  it('rewards volume, intensity, quality and streak', () => {
    const easy = xpForWorkout({ reps: 50, holdSeconds: 0, minutes: 10, intensity: 'easy', quality: 0.7, streakDays: 0 });
    const hard = xpForWorkout({ reps: 50, holdSeconds: 0, minutes: 10, intensity: 'hard', quality: 1, streakDays: 5 });
    expect(hard).toBeGreaterThan(easy);
    expect(easy).toBe(50 + 50 + 20);
  });
});

describe('badges', () => {
  it('grants only new badges', () => {
    const snap = { workoutsCompleted: 1, streakDays: 3, totalReps: 10, repsByExercise: { squat: 100 }, hardWorkouts: 0, perfectWorkouts: 0, programsCompleted: 0, level: 1 };
    expect(newlyEarnedBadges(snap, [])).toEqual(['first_workout', 'streak_3', 'squats_100']);
    expect(newlyEarnedBadges(snap, ['first_workout'])).toEqual(['streak_3', 'squats_100']);
  });
});

describe('streak', () => {
  it('counts consecutive calendar days', () => {
    expect(computeStreak(['2026-01-01', '2026-01-02', '2026-01-03'], '2026-01-03')).toBe(3);
    expect(computeStreak(['2026-01-01', '2026-01-02'], '2026-01-03')).toBe(2);
    expect(computeStreak(['2026-01-01'], '2026-01-03')).toBe(0);
  });
  it('only breaks on missed scheduled days', () => {
    const scheduled = ['2026-01-01', '2026-01-03', '2026-01-05', '2026-01-07'];
    expect(computeStreak(['2026-01-01', '2026-01-03', '2026-01-05'], '2026-01-06', scheduled)).toBe(3);
    expect(computeStreak(['2026-01-01', '2026-01-05'], '2026-01-05', scheduled)).toBe(1);
    expect(computeStreak(['2026-01-01', '2026-01-03'], '2026-01-05', scheduled)).toBe(2);
    expect(missedScheduledDays(['2026-01-01'], scheduled, '2026-01-06')).toEqual(['2026-01-03', '2026-01-05']);
  });
});
