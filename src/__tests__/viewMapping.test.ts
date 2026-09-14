import { mapPoseToView } from '@/domain/pose/viewMapping';
import { makePose } from './poseFixtures';

describe('view mapping', () => {
  it('maps normalised coordinates onto a cover-fitted, mirrored preview', () => {
    const pose = makePose({ nose: [0.25, 0.5] });
    const mapped = mapPoseToView(pose, { viewWidth: 400, viewHeight: 800, imageWidth: 480, imageHeight: 640, mirror: true, resizeMode: 'cover' });
    // Cover: scale = 800/640 = 1.25 → drawn 600x800, offsetX = -100.
    const nose = mapped.keypoints[0]!;
    expect(nose.x).toBeCloseTo(-100 + 0.75 * 600);
    expect(nose.y).toBeCloseTo(400);
  });
  it('letterboxes in contain mode', () => {
    const pose = makePose({ nose: [0, 0] });
    const mapped = mapPoseToView(pose, { viewWidth: 400, viewHeight: 800, imageWidth: 480, imageHeight: 640, mirror: false, resizeMode: 'contain' });
    // Contain: scale = 400/480 → drawn 400x533, offsetY = 133.
    expect(mapped.keypoints[0]!.x).toBeCloseTo(0);
    expect(mapped.keypoints[0]!.y).toBeCloseTo((800 - 640 * (400 / 480)) / 2);
  });
});
