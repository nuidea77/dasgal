import { AnalyzerId } from '../pose/analyzers';
import { KeypointName } from '../pose/types';

export type MuscleGroup = 'legs' | 'chest' | 'core' | 'glutes' | 'full_body' | 'cardio' | 'back' | 'arms';
export type Difficulty = 1 | 2 | 3;

/**
 * - reps_ai: reps are counted by the pose analyzer.
 * - hold_ai: seconds accumulate while the pose analyzer sees correct form.
 * - timed: plain countdown (movement too complex/fast for reliable single-camera counting).
 */
export type CountingMode = 'reps_ai' | 'hold_ai' | 'timed';

export interface Exercise {
  id: string;
  /** i18n key for name/instructions: exercises.<id>.name etc. */
  analyzer?: AnalyzerId;
  countingMode: CountingMode;
  muscles: MuscleGroup[];
  difficulty: Difficulty;
  /** Approximate kcal per rep (reps) or per second (hold/timed) for a 70 kg person. */
  kcalPerUnit: number;
  /** Joints that must be visible for the camera check. */
  requiredJoints: KeypointName[];
  /** Best camera placement hint key. */
  cameraHint: 'side' | 'front';
  /** Optional demo GIF (remote or bundled). The built-in stick figure demo is used when missing. */
  gifUrl?: string;
  /** Exercises that can substitute this one (same muscle group, adjacent difficulty). */
  alternatives: string[];
  /** Stick-figure demo poses (normalised 17 keypoints) for the built-in animated demo. */
  demo: { rest: number[][]; active: number[][] };
}

const FULL_BODY: KeypointName[] = [
  'nose',
  'left_shoulder',
  'right_shoulder',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
];
const UPPER: KeypointName[] = ['nose', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip'];

// Demo poses: [x, y] normalised, order = KEYPOINT_NAMES (17 points). Side view unless noted.
const STAND: number[][] = [
  [0.5, 0.12], [0.52, 0.11], [0.48, 0.11], [0.54, 0.12], [0.46, 0.12],
  [0.5, 0.28], [0.5, 0.28], [0.5, 0.42], [0.5, 0.42], [0.5, 0.55], [0.5, 0.55],
  [0.5, 0.56], [0.5, 0.56], [0.5, 0.75], [0.5, 0.75], [0.5, 0.94], [0.5, 0.94],
];
const SQUAT_DOWN: number[][] = [
  [0.42, 0.34], [0.44, 0.33], [0.4, 0.33], [0.46, 0.34], [0.38, 0.34],
  [0.46, 0.48], [0.46, 0.48], [0.36, 0.55], [0.36, 0.55], [0.28, 0.5], [0.28, 0.5],
  [0.6, 0.68], [0.6, 0.68], [0.42, 0.78], [0.42, 0.78], [0.5, 0.94], [0.5, 0.94],
];
const PUSHUP_UP: number[][] = [
  [0.2, 0.5], [0.22, 0.49], [0.18, 0.49], [0.24, 0.5], [0.16, 0.5],
  [0.28, 0.58], [0.28, 0.58], [0.28, 0.7], [0.28, 0.7], [0.28, 0.82], [0.28, 0.82],
  [0.55, 0.66], [0.55, 0.66], [0.72, 0.74], [0.72, 0.74], [0.88, 0.82], [0.88, 0.82],
];
const PUSHUP_DOWN: number[][] = [
  [0.2, 0.7], [0.22, 0.69], [0.18, 0.69], [0.24, 0.7], [0.16, 0.7],
  [0.28, 0.74], [0.28, 0.74], [0.4, 0.8], [0.4, 0.8], [0.28, 0.82], [0.28, 0.82],
  [0.55, 0.77], [0.55, 0.77], [0.72, 0.8], [0.72, 0.8], [0.88, 0.84], [0.88, 0.84],
];
const LUNGE_DOWN: number[][] = [
  [0.5, 0.2], [0.52, 0.19], [0.48, 0.19], [0.54, 0.2], [0.46, 0.2],
  [0.5, 0.36], [0.5, 0.36], [0.5, 0.5], [0.5, 0.5], [0.5, 0.62], [0.5, 0.62],
  [0.5, 0.6], [0.5, 0.6], [0.3, 0.78], [0.66, 0.8], [0.3, 0.94], [0.8, 0.94],
];
const JJ_OPEN: number[][] = [
  [0.5, 0.12], [0.52, 0.11], [0.48, 0.11], [0.54, 0.12], [0.46, 0.12],
  [0.4, 0.28], [0.6, 0.28], [0.3, 0.18], [0.7, 0.18], [0.24, 0.06], [0.76, 0.06],
  [0.45, 0.56], [0.55, 0.56], [0.36, 0.75], [0.64, 0.75], [0.28, 0.94], [0.72, 0.94],
];
const JJ_CLOSED: number[][] = [
  [0.5, 0.12], [0.52, 0.11], [0.48, 0.11], [0.54, 0.12], [0.46, 0.12],
  [0.42, 0.28], [0.58, 0.28], [0.4, 0.42], [0.6, 0.42], [0.4, 0.55], [0.6, 0.55],
  [0.46, 0.56], [0.54, 0.56], [0.46, 0.75], [0.54, 0.75], [0.46, 0.94], [0.54, 0.94],
];
const SITUP_DOWN: number[][] = [
  [0.14, 0.78], [0.16, 0.77], [0.12, 0.77], [0.18, 0.78], [0.1, 0.78],
  [0.24, 0.8], [0.24, 0.8], [0.3, 0.72], [0.3, 0.72], [0.34, 0.66], [0.34, 0.66],
  [0.5, 0.82], [0.5, 0.82], [0.62, 0.62], [0.62, 0.62], [0.74, 0.84], [0.74, 0.84],
];
const SITUP_UP: number[][] = [
  [0.44, 0.44], [0.46, 0.43], [0.42, 0.43], [0.48, 0.44], [0.4, 0.44],
  [0.42, 0.58], [0.42, 0.58], [0.5, 0.62], [0.5, 0.62], [0.56, 0.58], [0.56, 0.58],
  [0.5, 0.82], [0.5, 0.82], [0.62, 0.62], [0.62, 0.62], [0.74, 0.84], [0.74, 0.84],
];
const BRIDGE_DOWN: number[][] = [
  [0.14, 0.8], [0.16, 0.79], [0.12, 0.79], [0.18, 0.8], [0.1, 0.8],
  [0.26, 0.82], [0.26, 0.82], [0.36, 0.84], [0.36, 0.84], [0.46, 0.86], [0.46, 0.86],
  [0.5, 0.84], [0.5, 0.84], [0.62, 0.64], [0.62, 0.64], [0.7, 0.86], [0.7, 0.86],
];
const BRIDGE_UP: number[][] = [
  [0.14, 0.8], [0.16, 0.79], [0.12, 0.79], [0.18, 0.8], [0.1, 0.8],
  [0.26, 0.82], [0.26, 0.82], [0.36, 0.84], [0.36, 0.84], [0.46, 0.86], [0.46, 0.86],
  [0.5, 0.66], [0.5, 0.66], [0.62, 0.62], [0.62, 0.62], [0.7, 0.86], [0.7, 0.86],
];
const PLANK: number[][] = [
  [0.2, 0.58], [0.22, 0.57], [0.18, 0.57], [0.24, 0.58], [0.16, 0.58],
  [0.28, 0.64], [0.28, 0.64], [0.26, 0.8], [0.26, 0.8], [0.34, 0.82], [0.34, 0.82],
  [0.55, 0.7], [0.55, 0.7], [0.72, 0.76], [0.72, 0.76], [0.88, 0.84], [0.88, 0.84],
];
const WALL_SIT: number[][] = [
  [0.4, 0.2], [0.42, 0.19], [0.38, 0.19], [0.44, 0.2], [0.36, 0.2],
  [0.4, 0.36], [0.4, 0.36], [0.4, 0.5], [0.4, 0.5], [0.4, 0.62], [0.4, 0.62],
  [0.4, 0.6], [0.4, 0.6], [0.6, 0.62], [0.6, 0.62], [0.6, 0.94], [0.6, 0.94],
];
const HIGH_KNEE: number[][] = [
  [0.5, 0.12], [0.52, 0.11], [0.48, 0.11], [0.54, 0.12], [0.46, 0.12],
  [0.5, 0.28], [0.5, 0.28], [0.44, 0.4], [0.56, 0.4], [0.42, 0.3], [0.58, 0.5],
  [0.5, 0.56], [0.5, 0.56], [0.62, 0.55], [0.5, 0.75], [0.58, 0.72], [0.5, 0.94],
];
const MC_REST: number[][] = PLANK;
const MC_ACTIVE: number[][] = [
  [0.2, 0.58], [0.22, 0.57], [0.18, 0.57], [0.24, 0.58], [0.16, 0.58],
  [0.28, 0.64], [0.28, 0.64], [0.26, 0.8], [0.26, 0.8], [0.34, 0.82], [0.34, 0.82],
  [0.55, 0.68], [0.55, 0.68], [0.42, 0.72], [0.72, 0.76], [0.44, 0.86], [0.88, 0.84],
];
const BURPEE_ACTIVE: number[][] = PUSHUP_DOWN;

export const EXERCISES: Record<string, Exercise> = {
  squat: {
    id: 'squat',
    analyzer: 'squat',
    countingMode: 'reps_ai',
    muscles: ['legs', 'glutes'],
    difficulty: 1,
    kcalPerUnit: 0.32,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['wall_sit', 'lunge', 'glute_bridge'],
    demo: { rest: STAND, active: SQUAT_DOWN },
  },
  pushup: {
    id: 'pushup',
    analyzer: 'pushup',
    countingMode: 'reps_ai',
    muscles: ['chest', 'arms', 'core'],
    difficulty: 2,
    kcalPerUnit: 0.36,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['knee_pushup', 'plank'],
    demo: { rest: PUSHUP_UP, active: PUSHUP_DOWN },
  },
  knee_pushup: {
    id: 'knee_pushup',
    analyzer: 'pushup',
    countingMode: 'reps_ai',
    muscles: ['chest', 'arms'],
    difficulty: 1,
    kcalPerUnit: 0.25,
    requiredJoints: UPPER,
    cameraHint: 'side',
    alternatives: ['pushup', 'plank'],
    demo: { rest: PUSHUP_UP, active: PUSHUP_DOWN },
  },
  lunge: {
    id: 'lunge',
    analyzer: 'lunge',
    countingMode: 'reps_ai',
    muscles: ['legs', 'glutes'],
    difficulty: 2,
    kcalPerUnit: 0.3,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['squat', 'glute_bridge'],
    demo: { rest: STAND, active: LUNGE_DOWN },
  },
  situp: {
    id: 'situp',
    analyzer: 'situp',
    countingMode: 'reps_ai',
    muscles: ['core'],
    difficulty: 2,
    kcalPerUnit: 0.22,
    requiredJoints: ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'],
    cameraHint: 'side',
    alternatives: ['plank', 'glute_bridge'],
    demo: { rest: SITUP_DOWN, active: SITUP_UP },
  },
  jumping_jack: {
    id: 'jumping_jack',
    analyzer: 'jumping_jack',
    countingMode: 'reps_ai',
    muscles: ['cardio', 'full_body'],
    difficulty: 1,
    kcalPerUnit: 0.2,
    requiredJoints: [...FULL_BODY, 'left_wrist', 'right_wrist'],
    cameraHint: 'front',
    alternatives: ['high_knees', 'mountain_climber'],
    demo: { rest: JJ_CLOSED, active: JJ_OPEN },
  },
  glute_bridge: {
    id: 'glute_bridge',
    analyzer: 'glute_bridge',
    countingMode: 'reps_ai',
    muscles: ['glutes', 'core'],
    difficulty: 1,
    kcalPerUnit: 0.18,
    requiredJoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'],
    cameraHint: 'side',
    alternatives: ['squat', 'wall_sit'],
    demo: { rest: BRIDGE_DOWN, active: BRIDGE_UP },
  },
  high_knees: {
    id: 'high_knees',
    analyzer: 'high_knees',
    countingMode: 'reps_ai',
    muscles: ['cardio', 'legs'],
    difficulty: 2,
    kcalPerUnit: 0.15,
    requiredJoints: FULL_BODY,
    cameraHint: 'front',
    alternatives: ['jumping_jack', 'mountain_climber'],
    demo: { rest: STAND, active: HIGH_KNEE },
  },
  plank: {
    id: 'plank',
    analyzer: 'plank',
    countingMode: 'hold_ai',
    muscles: ['core'],
    difficulty: 1,
    kcalPerUnit: 0.06,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['situp', 'glute_bridge'],
    demo: { rest: PLANK, active: PLANK },
  },
  wall_sit: {
    id: 'wall_sit',
    analyzer: 'wall_sit',
    countingMode: 'hold_ai',
    muscles: ['legs'],
    difficulty: 1,
    kcalPerUnit: 0.07,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['squat', 'glute_bridge'],
    demo: { rest: WALL_SIT, active: WALL_SIT },
  },
  mountain_climber: {
    id: 'mountain_climber',
    countingMode: 'timed',
    muscles: ['cardio', 'core'],
    difficulty: 2,
    kcalPerUnit: 0.14,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['high_knees', 'jumping_jack'],
    demo: { rest: MC_REST, active: MC_ACTIVE },
  },
  burpee: {
    id: 'burpee',
    countingMode: 'timed',
    muscles: ['full_body', 'cardio'],
    difficulty: 3,
    kcalPerUnit: 0.17,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['jumping_jack', 'mountain_climber'],
    demo: { rest: STAND, active: BURPEE_ACTIVE },
  },
};

export const EXERCISE_IDS = Object.keys(EXERCISES);

export function getExercise(id: string): Exercise {
  const ex = EXERCISES[id];
  if (!ex) throw new Error(`Unknown exercise ${id}`);
  return ex;
}
