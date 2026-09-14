import { KEYPOINT_NAMES, Keypoint, KeypointName, Pose } from '@/domain/pose/types';

type Pt = [number, number] | [number, number, number];

const STANDING: Record<KeypointName, Pt> = {
  nose: [0.5, 0.1],
  left_eye: [0.51, 0.09],
  right_eye: [0.49, 0.09],
  left_ear: [0.52, 0.1],
  right_ear: [0.48, 0.1],
  left_shoulder: [0.5, 0.25],
  right_shoulder: [0.5, 0.25],
  left_elbow: [0.5, 0.38],
  right_elbow: [0.5, 0.38],
  left_wrist: [0.5, 0.5],
  right_wrist: [0.5, 0.5],
  left_hip: [0.5, 0.5],
  right_hip: [0.5, 0.5],
  left_knee: [0.5, 0.7],
  right_knee: [0.5, 0.7],
  left_ankle: [0.5, 0.9],
  right_ankle: [0.5, 0.9],
};

export function makePose(overrides: Partial<Record<KeypointName, Pt>> = {}, timestamp = 0, defaultScore = 0.9): Pose {
  const keypoints: Keypoint[] = KEYPOINT_NAMES.map((name) => {
    const p = overrides[name] ?? STANDING[name];
    return { name, x: p[0], y: p[1], score: p[2] ?? defaultScore };
  });
  return { keypoints, score: defaultScore, timestamp };
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Side-view squat pose with a given knee angle (180 = standing) and torso lean from vertical.
 * Knee is fixed, ankle below it; hip rotates around the knee; shoulder rotates around the hip.
 */
export function squatPose(kneeAngle: number, lean = 0, timestamp = 0): Pose {
  const knee: [number, number] = [0.5, 0.7];
  const ankle: [number, number] = [0.5, 0.9];
  const thigh = 0.2;
  const hip: [number, number] = [knee[0] + thigh * Math.sin(rad(kneeAngle)), knee[1] + thigh * Math.cos(rad(kneeAngle))];
  const torso = 0.25;
  const shoulder: [number, number] = [hip[0] - torso * Math.sin(rad(lean)), hip[1] - torso * Math.cos(rad(lean))];
  const nose: [number, number] = [shoulder[0], shoulder[1] - 0.12];
  return makePose(
    {
      left_hip: hip,
      right_hip: hip,
      left_knee: knee,
      right_knee: knee,
      left_ankle: ankle,
      right_ankle: ankle,
      left_shoulder: shoulder,
      right_shoulder: shoulder,
      nose,
      left_eye: [nose[0] + 0.01, nose[1]],
      right_eye: [nose[0] - 0.01, nose[1]],
      left_ear: [nose[0] + 0.02, nose[1] + 0.01],
      right_ear: [nose[0] - 0.02, nose[1] + 0.01],
      left_elbow: [shoulder[0], shoulder[1] + 0.12],
      right_elbow: [shoulder[0], shoulder[1] + 0.12],
      left_wrist: [shoulder[0], shoulder[1] + 0.24],
      right_wrist: [shoulder[0], shoulder[1] + 0.24],
    },
    timestamp,
  );
}

/**
 * Side-view push-up pose. Elbow angle 180 = top; hipSag > 0 pushes the hips below the shoulder–ankle line.
 */
export function pushupPose(elbowAngle: number, hipSag = 0, timestamp = 0): Pose {
  const shoulder: [number, number] = [0.3, 0.6];
  const ankle: [number, number] = [0.9, 0.8];
  const hip: [number, number] = [0.6, 0.7 + hipSag];
  const upper = 0.15;
  // Arm hangs below the shoulder; elbow angle 180 = straight down, smaller = bent (wrist stays under shoulder).
  const wrist: [number, number] = [0.3, 0.6 + 0.28 * Math.sin(rad(elbowAngle / 2))];
  const elbow: [number, number] = [shoulder[0] + upper * Math.cos(rad(elbowAngle / 2)), shoulder[1] + upper * Math.sin(rad(elbowAngle / 2))];
  return makePose(
    {
      nose: [0.22, 0.58],
      left_eye: [0.23, 0.57],
      right_eye: [0.21, 0.57],
      left_ear: [0.24, 0.58],
      right_ear: [0.2, 0.58],
      left_shoulder: shoulder,
      right_shoulder: shoulder,
      left_elbow: elbow,
      right_elbow: elbow,
      left_wrist: wrist,
      right_wrist: wrist,
      left_hip: hip,
      right_hip: hip,
      left_knee: [0.75, 0.75 + hipSag / 2],
      right_knee: [0.75, 0.75 + hipSag / 2],
      left_ankle: ankle,
      right_ankle: ankle,
    },
    timestamp,
  );
}

export function jumpingJackPose(open: boolean, timestamp = 0, armsUp = open): Pose {
  return makePose(
    {
      left_shoulder: [0.42, 0.25],
      right_shoulder: [0.58, 0.25],
      left_ankle: open ? [0.3, 0.9] : [0.47, 0.9],
      right_ankle: open ? [0.7, 0.9] : [0.53, 0.9],
      left_wrist: armsUp ? [0.35, 0.02] : [0.4, 0.5],
      right_wrist: armsUp ? [0.65, 0.02] : [0.6, 0.5],
    },
    timestamp,
  );
}
