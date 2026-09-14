import { angleBetween, angleFromVertical, PoseSmoother } from '@/domain/pose/geometry';
import { makePose } from './poseFixtures';

describe('geometry', () => {
  it('computes interior angles', () => {
    expect(angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(90);
    expect(angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 })).toBeCloseTo(180);
    expect(angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(0);
  });

  it('returns 0 for degenerate points', () => {
    expect(angleBetween({ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 2 })).toBe(0);
  });

  it('measures lean from vertical', () => {
    expect(angleFromVertical({ x: 0, y: 1 }, { x: 0, y: 0 })).toBeCloseTo(0);
    expect(angleFromVertical({ x: 0, y: 1 }, { x: 1, y: 0 })).toBeCloseTo(45);
    expect(angleFromVertical({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(90);
  });

  it('smooths keypoints towards new values', () => {
    const s = new PoseSmoother(0.5);
    const a = s.smooth(makePose({ nose: [0, 0] }));
    expect(a.keypoints[0]!.x).toBe(0);
    const b = s.smooth(makePose({ nose: [1, 1] }));
    expect(b.keypoints[0]!.x).toBeCloseTo(0.5);
    const c = s.smooth(makePose({ nose: [1, 1] }));
    expect(c.keypoints[0]!.x).toBeCloseTo(0.75);
  });
});
