/**
 * Pose model shared by every detector backend (MoveNet 17-point is the canonical
 * layout; MediaPipe/BlazePose 33-point results are mapped onto it).
 */
export const KEYPOINT_NAMES = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const;

export type KeypointName = (typeof KEYPOINT_NAMES)[number];

export const KEYPOINT_INDEX: Record<KeypointName, number> = KEYPOINT_NAMES.reduce(
  (acc, name, i) => {
    acc[name] = i;
    return acc;
  },
  {} as Record<KeypointName, number>,
);

/** Normalised keypoint: x,y in [0,1] relative to the *model input* (top-left origin). */
export interface Keypoint {
  name: KeypointName;
  x: number;
  y: number;
  score: number;
}

export interface Pose {
  keypoints: Keypoint[];
  /** Mean score of the keypoints, 0..1 */
  score: number;
  /** Wall-clock time the frame was captured (ms). */
  timestamp: number;
}

/** Skeleton edges used for drawing the overlay. */
export const SKELETON_EDGES: Array<[KeypointName, KeypointName]> = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],
];

export function getKeypoint(pose: Pose, name: KeypointName): Keypoint {
  const kp = pose.keypoints[KEYPOINT_INDEX[name]];
  if (!kp) {
    throw new Error(`Pose is missing keypoint ${name}`);
  }
  return kp;
}
