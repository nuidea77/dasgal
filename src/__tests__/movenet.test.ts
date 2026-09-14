import { decodeMoveNet, fromBlazePose } from '@/services/pose/movenet';

describe('pose decoders', () => {
  it('decodes MoveNet [y, x, score] triples', () => {
    const out = new Float32Array(51);
    out[0] = 0.2; // nose y
    out[1] = 0.6; // nose x
    out[2] = 0.95;
    const pose = decodeMoveNet(out, 123);
    expect(pose.keypoints).toHaveLength(17);
    expect(pose.keypoints[0]!.name).toBe('nose');
    expect(pose.keypoints[0]!.x).toBeCloseTo(0.6);
    expect(pose.keypoints[0]!.y).toBeCloseTo(0.2);
    expect(pose.keypoints[0]!.score).toBeCloseTo(0.95);
    expect(pose.timestamp).toBe(123);
  });
  it('maps BlazePose 33 landmarks onto the 17-point layout', () => {
    const lms = Array.from({ length: 33 }, (_, i) => ({ x: i / 33, y: 0, visibility: 1 }));
    const pose = fromBlazePose(lms, 1);
    expect(pose.keypoints[5]!.name).toBe('left_shoulder');
    expect(pose.keypoints[5]!.x).toBeCloseTo(11 / 33);
    expect(pose.keypoints[16]!.name).toBe('right_ankle');
    expect(pose.keypoints[16]!.x).toBeCloseTo(28 / 33);
  });
});
