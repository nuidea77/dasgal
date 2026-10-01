import { BADGES, BADGE_GROUPS, ProgressSnapshot, badgeProgress, nextBadge, newlyEarnedBadges } from '@/domain/gamification/badges';

const empty: ProgressSnapshot = {
  workoutsCompleted: 0, streakDays: 0, totalReps: 0, repsByExercise: {}, hardWorkouts: 0, perfectWorkouts: 0, programsCompleted: 0, level: 1,
};

describe('badgeProgress', () => {
  it('counts toward every badge', () => {
    for (const b of BADGES) {
      const p = badgeProgress(b.id, empty);
      expect(p.target).toBeGreaterThan(0);
      expect(p.ratio).toBeGreaterThanOrEqual(0);
    }
  });

  it('reports how far along a locked badge is', () => {
    expect(badgeProgress('streak_7', { ...empty, streakDays: 5 })).toEqual({ current: 5, target: 7, ratio: 5 / 7 });
    expect(badgeProgress('reps_1000', { ...empty, totalReps: 430 })).toEqual({ current: 430, target: 1000, ratio: 0.43 });
  });

  it('clamps at the target once earned', () => {
    expect(badgeProgress('streak_3', { ...empty, streakDays: 12 })).toEqual({ current: 3, target: 3, ratio: 1 });
  });

  it('adds knee push-ups to the push-up count', () => {
    const p = badgeProgress('pushups_100', { ...empty, repsByExercise: { pushup: 60, knee_pushup: 25 } });
    expect(p.current).toBe(85);
  });

  it('starts level badges from level 1', () => {
    expect(badgeProgress('level_5', { ...empty, level: 1 })).toEqual({ current: 1, target: 5, ratio: 0 });
    expect(badgeProgress('level_5', { ...empty, level: 3 })).toEqual({ current: 3, target: 5, ratio: 0.5 });
  });

  it('is zero for an unknown badge', () => {
    expect(badgeProgress('nope', empty).ratio).toBe(0);
  });

  it('agrees with newlyEarnedBadges', () => {
    const snap = { ...empty, workoutsCompleted: 1, streakDays: 3, repsByExercise: { squat: 100 }, totalReps: 100 };
    expect(newlyEarnedBadges(snap, [])).toEqual(['first_workout', 'streak_3', 'squats_100']);
    expect(newlyEarnedBadges(snap, ['first_workout'])).toEqual(['streak_3', 'squats_100']);
  });
});

describe('nextBadge', () => {
  it('picks the closest locked badge', () => {
    const snap = { ...empty, workoutsCompleted: 4, streakDays: 5, totalReps: 300 };
    const next = nextBadge(snap, ['first_workout', 'streak_3']);
    expect(next?.id).toBe('streak_7');
    expect(next?.progress).toEqual({ current: 5, target: 7, ratio: 5 / 7 });
  });

  it('prefers the smaller requirement on a tie', () => {
    // Nothing done: every badge is at zero, so suggest the cheapest one.
    expect(nextBadge(empty, [])?.id).toBe('first_workout');
  });

  it('is undefined once every badge is earned', () => {
    expect(nextBadge(empty, BADGES.map((b) => b.id))).toBeUndefined();
  });
});

describe('badge groups', () => {
  it('puts every badge on a known shelf', () => {
    for (const b of BADGES) expect(BADGE_GROUPS).toContain(b.group);
  });
});
