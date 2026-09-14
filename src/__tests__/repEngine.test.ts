import { createAnalyzer } from '@/domain/pose/analyzers';
import { AnalysisResult } from '@/domain/pose/repEngine';
import { jumpingJackPose, makePose, pushupPose, squatPose } from './poseFixtures';

/** Feeds a list of poses (100 ms apart) and returns all results. */
function run(analyzerId: Parameters<typeof createAnalyzer>[0], poses: Array<ReturnType<typeof makePose>>): AnalysisResult[] {
  const a = createAnalyzer(analyzerId);
  return poses.map((p) => a.process(p));
}

function sequence(angles: number[], make: (angle: number, ts: number) => ReturnType<typeof makePose>): ReturnType<typeof makePose>[] {
  return angles.map((angle, i) => make(angle, i * 100));
}

describe('squat analyzer', () => {
  const stand = 175;
  const deep = 85;
  it('counts full reps and ignores jitter', () => {
    // Three frames standing to lock in the rest phase, then three full reps.
    const angles = [stand, stand, stand, ...[140, 110, deep, deep, deep, 110, 140, stand, stand, stand], ...[140, 110, deep, deep, deep, 110, 140, stand, stand, stand], ...[140, 110, deep, deep, deep, 110, 140, stand, stand, stand]];
    const results = run('squat', sequence(angles, (a, ts) => squatPose(a, 0, ts)));
    expect(results[results.length - 1]!.reps).toBe(3);
    expect(results.filter((r) => r.repCounted)).toHaveLength(3);
    expect(results.some((r) => r.feedback.includes('good_rep') || r.feedback.includes('perfect'))).toBe(true);
  });

  it('does not count a partial rep and asks to go lower', () => {
    const angles = [stand, stand, stand, 150, 130, 120, 120, 130, 150, stand, stand, stand];
    const results = run('squat', sequence(angles, (a, ts) => squatPose(a, 0, ts)));
    expect(results[results.length - 1]!.reps).toBe(0);
    expect(results.some((r) => r.feedback.includes('go_lower'))).toBe(true);
  });

  it('flags a rounded/leaning back at the bottom', () => {
    const poses = [squatPose(stand, 0, 0), squatPose(stand, 0, 100), squatPose(stand, 0, 200), squatPose(85, 60, 300), squatPose(85, 60, 400), squatPose(85, 60, 500)];
    const results = run('squat', poses);
    expect(results.some((r) => r.feedback.includes('straighten_back'))).toBe(true);
  });

  it('reports low visibility when the legs are missing', () => {
    const p = makePose({ left_knee: [0.5, 0.7, 0.05], right_knee: [0.5, 0.7, 0.05] });
    const [r] = run('squat', [p]);
    expect(r!.metric).toBeNull();
    expect(r!.feedback).toContain('low_visibility');
  });

  it('does not double count when bouncing at the threshold', () => {
    const angles = [stand, stand, stand, 90, 90, 90, 155, 165, 158, 165, 158, 165, 170, 170];
    const results = run('squat', sequence(angles, (a, ts) => squatPose(a, 0, ts)));
    expect(results[results.length - 1]!.reps).toBe(1);
  });
});

describe('push-up analyzer', () => {
  it('counts reps and warns about sagging hips', () => {
    const top = 175;
    const bottom = 80;
    const angles = [top, top, top, 140, bottom, bottom, bottom, 140, top, top, top];
    const clean = run('pushup', sequence(angles, (a, ts) => pushupPose(a, 0, ts)));
    expect(clean[clean.length - 1]!.reps).toBe(1);
    expect(clean.some((r) => r.feedback.includes('keep_hips_up'))).toBe(false);

    const saggy = run('pushup', sequence(angles, (a, ts) => pushupPose(a, 0.12, ts)));
    expect(saggy.some((r) => r.feedback.includes('keep_hips_up'))).toBe(true);
    // Quality of a rep with a form warning is lower than a clean one.
    const cleanQ = clean.find((r) => r.repCounted)!.lastRepQuality;
    const saggyQ = saggy.find((r) => r.repCounted)?.lastRepQuality ?? 0;
    expect(saggyQ).toBeLessThan(cleanQ);
  });
});

describe('jumping jack analyzer', () => {
  it('counts open/close cycles and checks arms overhead', () => {
    const frames = [false, false, false, true, true, true, false, false, false, true, true, true, false, false, false].map((open, i) => jumpingJackPose(open, i * 100));
    const results = run('jumping_jack', frames);
    expect(results[results.length - 1]!.reps).toBe(2);
    const lazyArms = [false, false, false, true, true, true, false, false, false].map((open, i) => jumpingJackPose(open, i * 100, false));
    const lazy = run('jumping_jack', lazyArms);
    expect(lazy.some((r) => r.feedback.includes('raise_arms_higher'))).toBe(true);
  });
});

describe('plank hold analyzer', () => {
  it('accumulates hold time only while the body is straight', () => {
    const a = createAnalyzer('plank');
    let r = a.process(pushupPose(175, 0, 0));
    r = a.process(pushupPose(175, 0, 1000));
    r = a.process(pushupPose(175, 0, 2000));
    expect(r.holdSeconds).toBeCloseTo(2, 1);
    expect(r.phase).toBe('active');
    // Hips sag for 2 s → hold pauses after the grace period and feedback appears.
    r = a.process(pushupPose(175, 0.15, 3000));
    r = a.process(pushupPose(175, 0.15, 4000));
    r = a.process(pushupPose(175, 0.15, 5000));
    expect(r.holdSeconds).toBeLessThan(3.1);
    expect(r.feedback.includes('keep_hips_up')).toBe(true);
    // Back in position, timer resumes.
    r = a.process(pushupPose(175, 0, 6000));
    r = a.process(pushupPose(175, 0, 7000));
    expect(r.holdSeconds).toBeGreaterThan(3);
    a.reset();
    expect(a.process(null).holdSeconds).toBe(0);
  });
});
