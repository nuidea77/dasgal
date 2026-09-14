import { evaluateFraming } from '@/domain/pose/framing';
import { KeypointName } from '@/domain/pose/types';
import { makePose } from './poseFixtures';

const required: KeypointName[] = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'];

describe('framing', () => {
  it('accepts a centred full body', () => {
    expect(evaluateFraming(makePose(), { required }).status).toBe('ok');
  });
  it('reports no person', () => {
    expect(evaluateFraming(null, { required }).status).toBe('no_person');
    expect(evaluateFraming(makePose({}, 0, 0.1), { required }).status).toBe('no_person');
  });
  it('detects cut-off feet and head', () => {
    expect(evaluateFraming(makePose({ left_ankle: [0.5, 0.9, 0.1], right_ankle: [0.5, 0.9, 0.1] }), { required }).status).toBe('feet_cut');
    expect(evaluateFraming(makePose({ nose: [0.5, 0.01] }), { required }).status).toBe('head_cut');
  });
  it('asks to move sideways or closer', () => {
    const shift = (dx: number) => {
      const p = makePose();
      p.keypoints.forEach((k) => (k.x += dx));
      return p;
    };
    expect(evaluateFraming(shift(-0.49), { required }).status).toBe('move_right');
    expect(evaluateFraming(shift(0.49), { required }).status).toBe('move_left');
    const tiny = makePose();
    tiny.keypoints.forEach((k) => (k.y = 0.4 + (k.y - 0.5) * 0.3));
    expect(evaluateFraming(tiny, { required }).status).toBe('move_closer');
  });
});
