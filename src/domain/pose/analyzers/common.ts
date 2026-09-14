import { angleFromVertical, betterSide, jointAngle, midpoint, minScore } from '../geometry';
import { FeedbackKey } from '../feedback';
import { KeypointName, Pose, getKeypoint } from '../types';

export const MIN_VISIBLE = 0.3;

export function visible(pose: Pose, names: KeypointName[], min = MIN_VISIBLE): boolean {
  return minScore(pose, names) >= min;
}

/** Knee flexion angle (hip–knee–ankle) on the better visible side. */
export function kneeAngle(pose: Pose): number | null {
  const side = betterSide(pose, [
    ['left_hip', 'right_hip'],
    ['left_knee', 'right_knee'],
    ['left_ankle', 'right_ankle'],
  ]);
  const joints: KeypointName[] = [`${side}_hip`, `${side}_knee`, `${side}_ankle`];
  if (!visible(pose, joints)) return null;
  return jointAngle(pose, joints[0]!, joints[1]!, joints[2]!);
}

/** Elbow flexion angle (shoulder–elbow–wrist) on the better visible side. */
export function elbowAngle(pose: Pose): number | null {
  const side = betterSide(pose, [
    ['left_shoulder', 'right_shoulder'],
    ['left_elbow', 'right_elbow'],
    ['left_wrist', 'right_wrist'],
  ]);
  const joints: KeypointName[] = [`${side}_shoulder`, `${side}_elbow`, `${side}_wrist`];
  if (!visible(pose, joints)) return null;
  return jointAngle(pose, joints[0]!, joints[1]!, joints[2]!);
}

/** Hip angle (shoulder–hip–knee) on the better visible side. */
export function hipAngle(pose: Pose): number | null {
  const side = betterSide(pose, [
    ['left_shoulder', 'right_shoulder'],
    ['left_hip', 'right_hip'],
    ['left_knee', 'right_knee'],
  ]);
  const joints: KeypointName[] = [`${side}_shoulder`, `${side}_hip`, `${side}_knee`];
  if (!visible(pose, joints)) return null;
  return jointAngle(pose, joints[0]!, joints[1]!, joints[2]!);
}

/** Body line angle (shoulder–hip–ankle). 180 = perfectly straight. */
export function bodyLineAngle(pose: Pose): number | null {
  const side = betterSide(pose, [
    ['left_shoulder', 'right_shoulder'],
    ['left_hip', 'right_hip'],
    ['left_ankle', 'right_ankle'],
  ]);
  const joints: KeypointName[] = [`${side}_shoulder`, `${side}_hip`, `${side}_ankle`];
  if (!visible(pose, joints)) return null;
  return jointAngle(pose, joints[0]!, joints[1]!, joints[2]!);
}

/** Torso lean from vertical in degrees (0 = upright). */
export function torsoLean(pose: Pose): number | null {
  if (!visible(pose, ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'])) return null;
  const shoulder = midpoint(getKeypoint(pose, 'left_shoulder'), getKeypoint(pose, 'right_shoulder'));
  const hip = midpoint(getKeypoint(pose, 'left_hip'), getKeypoint(pose, 'right_hip'));
  return angleFromVertical(hip, shoulder);
}

export function shoulderWidth(pose: Pose): number {
  const l = getKeypoint(pose, 'left_shoulder');
  const r = getKeypoint(pose, 'right_shoulder');
  return Math.hypot(l.x - r.x, l.y - r.y);
}

export function torsoLength(pose: Pose): number {
  const s = midpoint(getKeypoint(pose, 'left_shoulder'), getKeypoint(pose, 'right_shoulder'));
  const h = midpoint(getKeypoint(pose, 'left_hip'), getKeypoint(pose, 'right_hip'));
  return Math.hypot(s.x - h.x, s.y - h.y);
}

export const backStraightCheck = (maxLean: number) => (pose: Pose): FeedbackKey | null => {
  const lean = torsoLean(pose);
  return lean !== null && lean > maxLean ? 'straighten_back' : null;
};

export const bodyStraightCheck = (minAngle: number) => (pose: Pose): FeedbackKey | null => {
  const a = bodyLineAngle(pose);
  if (a === null) return null;
  if (a >= minAngle) return null;
  // Decide whether hips sag (below the line) or pike (above).
  const side = betterSide(pose, [
    ['left_shoulder', 'right_shoulder'],
    ['left_hip', 'right_hip'],
  ]);
  const s = getKeypoint(pose, `${side}_shoulder`);
  const h = getKeypoint(pose, `${side}_hip`);
  const an = getKeypoint(pose, `${side}_ankle`);
  const lineY = s.y + ((h.x - s.x) * (an.y - s.y)) / ((an.x - s.x) || 1e-6);
  return h.y > lineY ? 'keep_hips_up' : 'keep_body_straight';
};
