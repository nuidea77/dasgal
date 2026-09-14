import { KEYPOINT_NAMES, Keypoint, Pose } from '@/domain/pose/types';

export const MOVENET_INPUT_SIZE = 192;

/**
 * Decodes MoveNet SinglePose output ([1,1,17,3] → y, x, score per keypoint)
 * into the shared Pose structure. Pure function so it can be unit-tested.
 */
export function decodeMoveNet(output: ArrayLike<number>, timestamp: number): Pose {
  const keypoints: Keypoint[] = [];
  let sum = 0;
  for (let i = 0; i < KEYPOINT_NAMES.length; i++) {
    const y = Number(output[i * 3] ?? 0);
    const x = Number(output[i * 3 + 1] ?? 0);
    const score = Number(output[i * 3 + 2] ?? 0);
    keypoints.push({ name: KEYPOINT_NAMES[i]!, x, y, score });
    sum += score;
  }
  return { keypoints, score: sum / KEYPOINT_NAMES.length, timestamp };
}

/**
 * Maps MediaPipe BlazePose (33 landmarks, {x,y,visibility}) to the 17-point layout.
 * Lets a MediaPipe backend plug into the same analyzers.
 */
export function fromBlazePose(landmarks: Array<{ x: number; y: number; visibility?: number }>, timestamp: number): Pose {
  const map: number[] = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  const keypoints: Keypoint[] = map.map((idx, i) => {
    const lm = landmarks[idx];
    return { name: KEYPOINT_NAMES[i]!, x: lm?.x ?? 0, y: lm?.y ?? 0, score: lm?.visibility ?? 0 };
  });
  const score = keypoints.reduce((s, k) => s + k.score, 0) / keypoints.length;
  return { keypoints, score, timestamp };
}
