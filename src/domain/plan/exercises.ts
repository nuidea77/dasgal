import { AnalyzerId } from '../pose/analyzers';
import { KeypointName } from '../pose/types';

export type MuscleGroup = 'legs' | 'chest' | 'core' | 'glutes' | 'full_body' | 'cardio' | 'back' | 'arms';
export const MUSCLE_GROUPS: MuscleGroup[] = ['legs', 'chest', 'core', 'glutes', 'back', 'arms', 'full_body', 'cardio'];
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
  /** Metabolic equivalent while performing the exercise (vigorous home circuit values). */
  met: number;
  /** kcal per rep (reps) or per second (hold/timed) for a 70 kg person, derived from `met` (see CIRCUIT_FACTOR). */
  kcalPerUnit: number;
  /** Joints that must be visible for the camera check. */
  requiredJoints: KeypointName[];
  /** Best camera placement hint key. */
  cameraHint: 'side' | 'front';
  /** True when a bundled demo GIF/photo exists in assets/exercises (see components/ExerciseImage). */
  hasMedia?: boolean;
  /** Exercises that can substitute this one (same muscle group, adjacent difficulty). */
  alternatives: string[];
  /** Stick-figure demo poses (normalised 17 keypoints) for the built-in animated demo. */
  demo: { rest: number[][]; active: number[][] };
}

/** Seconds one rep takes at a controlled tempo; cardio moves are quicker. */
export const SECONDS_PER_REP = { strength: 3, cardio: 1.5 } as const;
/** Circuit-training multiplier: transitions and the elevated heart rate after each set (EPOC). */
export const CIRCUIT_FACTOR = 1.25;
/** Heart rate stays up while resting between sets in a circuit. */
export const REST_MET = 4.5;

/** kcal for a 70 kg person per unit (rep or second) at the given MET. */
export function kcalPerUnitFromMet(met: number, mode: CountingMode, cardio: boolean): number {
  const seconds = mode === 'reps_ai' ? (cardio ? SECONDS_PER_REP.cardio : SECONDS_PER_REP.strength) : 1;
  return Math.round(((met * 70) / 3600) * seconds * CIRCUIT_FACTOR * 1000) / 1000;
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
const LOWER: KeypointName[] = ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'];
const LYING: KeypointName[] = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'];
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
const PRONE: number[][] = [
  [0.14, 0.84], [0.16, 0.83], [0.12, 0.83], [0.18, 0.84], [0.1, 0.84],
  [0.26, 0.86], [0.26, 0.86], [0.16, 0.9], [0.16, 0.9], [0.06, 0.88], [0.06, 0.88],
  [0.5, 0.88], [0.5, 0.88], [0.68, 0.9], [0.68, 0.9], [0.86, 0.92], [0.86, 0.92],
];
const SUPERMAN: number[][] = [
  [0.14, 0.72], [0.16, 0.71], [0.12, 0.71], [0.18, 0.72], [0.1, 0.72],
  [0.26, 0.8], [0.26, 0.8], [0.14, 0.74], [0.14, 0.74], [0.04, 0.68], [0.04, 0.68],
  [0.5, 0.88], [0.5, 0.88], [0.68, 0.82], [0.68, 0.82], [0.86, 0.74], [0.86, 0.74],
];
const LEG_RAISE_UP: number[][] = [
  [0.14, 0.8], [0.16, 0.79], [0.12, 0.79], [0.18, 0.8], [0.1, 0.8],
  [0.26, 0.82], [0.26, 0.82], [0.36, 0.84], [0.36, 0.84], [0.46, 0.86], [0.46, 0.86],
  [0.5, 0.84], [0.5, 0.84], [0.52, 0.62], [0.52, 0.62], [0.54, 0.4], [0.54, 0.4],
];
const LYING_FLAT: number[][] = [
  [0.14, 0.8], [0.16, 0.79], [0.12, 0.79], [0.18, 0.8], [0.1, 0.8],
  [0.26, 0.82], [0.26, 0.82], [0.36, 0.84], [0.36, 0.84], [0.46, 0.86], [0.46, 0.86],
  [0.5, 0.84], [0.5, 0.84], [0.68, 0.85], [0.68, 0.85], [0.86, 0.86], [0.86, 0.86],
];
const HINGE: number[][] = [
  [0.3, 0.42], [0.32, 0.41], [0.28, 0.41], [0.34, 0.42], [0.26, 0.42],
  [0.36, 0.5], [0.36, 0.5], [0.3, 0.6], [0.3, 0.6], [0.26, 0.68], [0.26, 0.68],
  [0.54, 0.58], [0.54, 0.58], [0.52, 0.76], [0.52, 0.76], [0.5, 0.94], [0.5, 0.94],
];
const ARMS_UP: number[][] = [
  [0.5, 0.12], [0.52, 0.11], [0.48, 0.11], [0.54, 0.12], [0.46, 0.12],
  [0.44, 0.28], [0.56, 0.28], [0.42, 0.16], [0.58, 0.16], [0.44, 0.04], [0.56, 0.04],
  [0.46, 0.56], [0.54, 0.56], [0.46, 0.75], [0.54, 0.75], [0.46, 0.94], [0.54, 0.94],
];
const ARMS_OUT: number[][] = [
  [0.5, 0.12], [0.52, 0.11], [0.48, 0.11], [0.54, 0.12], [0.46, 0.12],
  [0.44, 0.28], [0.56, 0.28], [0.3, 0.28], [0.7, 0.28], [0.16, 0.28], [0.84, 0.28],
  [0.46, 0.56], [0.54, 0.56], [0.46, 0.75], [0.54, 0.75], [0.46, 0.94], [0.54, 0.94],
];
const WALL_PUSH: number[][] = [
  [0.44, 0.16], [0.46, 0.15], [0.42, 0.15], [0.48, 0.16], [0.4, 0.16],
  [0.46, 0.3], [0.46, 0.3], [0.34, 0.34], [0.34, 0.34], [0.24, 0.3], [0.24, 0.3],
  [0.52, 0.56], [0.52, 0.56], [0.56, 0.75], [0.56, 0.75], [0.6, 0.94], [0.6, 0.94],
];
const DIP_DOWN: number[][] = [
  [0.3, 0.5], [0.32, 0.49], [0.28, 0.49], [0.34, 0.5], [0.26, 0.5],
  [0.3, 0.64], [0.3, 0.64], [0.2, 0.76], [0.2, 0.76], [0.22, 0.9], [0.22, 0.9],
  [0.44, 0.78], [0.44, 0.78], [0.6, 0.66], [0.6, 0.66], [0.66, 0.9], [0.66, 0.9],
];
const DIP_UP: number[][] = [
  [0.3, 0.36], [0.32, 0.35], [0.28, 0.35], [0.34, 0.36], [0.26, 0.36],
  [0.3, 0.5], [0.3, 0.5], [0.26, 0.7], [0.26, 0.7], [0.22, 0.9], [0.22, 0.9],
  [0.44, 0.64], [0.44, 0.64], [0.6, 0.6], [0.6, 0.6], [0.66, 0.9], [0.66, 0.9],
];
const PIKE: number[][] = [
  [0.4, 0.62], [0.42, 0.61], [0.38, 0.61], [0.44, 0.62], [0.36, 0.62],
  [0.4, 0.5], [0.4, 0.5], [0.34, 0.68], [0.34, 0.68], [0.3, 0.88], [0.3, 0.88],
  [0.56, 0.3], [0.56, 0.3], [0.68, 0.6], [0.68, 0.6], [0.8, 0.9], [0.8, 0.9],
];
const PIKE_DOWN: number[][] = [
  [0.34, 0.8], [0.36, 0.79], [0.32, 0.79], [0.38, 0.8], [0.3, 0.8],
  [0.38, 0.62], [0.38, 0.62], [0.26, 0.74], [0.26, 0.74], [0.3, 0.88], [0.3, 0.88],
  [0.56, 0.32], [0.56, 0.32], [0.68, 0.6], [0.68, 0.6], [0.8, 0.9], [0.8, 0.9],
];
const CRAWL: number[][] = [
  [0.2, 0.5], [0.22, 0.49], [0.18, 0.49], [0.24, 0.5], [0.16, 0.5],
  [0.28, 0.58], [0.28, 0.58], [0.24, 0.72], [0.24, 0.72], [0.22, 0.86], [0.22, 0.86],
  [0.56, 0.58], [0.56, 0.58], [0.62, 0.74], [0.62, 0.74], [0.66, 0.86], [0.66, 0.86],
];
const SKATER: number[][] = [
  [0.4, 0.22], [0.42, 0.21], [0.38, 0.21], [0.44, 0.22], [0.36, 0.22],
  [0.36, 0.38], [0.48, 0.38], [0.24, 0.46], [0.6, 0.46], [0.16, 0.5], [0.66, 0.34],
  [0.44, 0.6], [0.5, 0.6], [0.34, 0.76], [0.64, 0.7], [0.3, 0.94], [0.72, 0.8],
];
const BUTT_KICK: number[][] = [
  [0.5, 0.12], [0.52, 0.11], [0.48, 0.11], [0.54, 0.12], [0.46, 0.12],
  [0.5, 0.28], [0.5, 0.28], [0.44, 0.4], [0.56, 0.4], [0.42, 0.3], [0.58, 0.5],
  [0.5, 0.56], [0.5, 0.56], [0.5, 0.75], [0.52, 0.72], [0.5, 0.94], [0.62, 0.62],
];


export const EXERCISES: Record<string, Exercise> = {
  squat: {
    id: 'squat',
    analyzer: 'squat', countingMode: 'reps_ai',
    muscles: ['legs', 'glutes'],
    difficulty: 1,
    met: 7,
    kcalPerUnit: 0.51,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['sumo_squat', 'wall_sit', 'lunge'],
    demo: { rest: STAND, active: SQUAT_DOWN },
  },
  sumo_squat: {
    id: 'sumo_squat',
    analyzer: 'squat', countingMode: 'reps_ai',
    muscles: ['legs', 'glutes'],
    difficulty: 1,
    met: 7,
    kcalPerUnit: 0.51,
    requiredJoints: FULL_BODY,
    cameraHint: 'front',
    alternatives: ['squat', 'wall_sit', 'glute_bridge'],
    demo: { rest: STAND, active: SQUAT_DOWN },
  },
  jump_squat: {
    id: 'jump_squat',
    analyzer: 'squat', countingMode: 'reps_ai',
    muscles: ['legs', 'cardio'],
    difficulty: 3,
    met: 9,
    kcalPerUnit: 0.328,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['squat', 'skater_jump', 'high_knees'],
    demo: { rest: SQUAT_DOWN, active: ARMS_UP },
  },
  lunge: {
    id: 'lunge',
    analyzer: 'lunge', countingMode: 'reps_ai',
    muscles: ['legs', 'glutes'],
    difficulty: 2,
    met: 6.5,
    kcalPerUnit: 0.474,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['reverse_lunge', 'squat', 'side_lunge'],
    demo: { rest: STAND, active: LUNGE_DOWN },
  },
  reverse_lunge: {
    id: 'reverse_lunge',
    analyzer: 'lunge', countingMode: 'reps_ai',
    muscles: ['legs', 'glutes'],
    difficulty: 2,
    met: 6.5,
    kcalPerUnit: 0.474,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['lunge', 'squat', 'glute_bridge'],
    demo: { rest: STAND, active: LUNGE_DOWN },
  },
  side_lunge: {
    id: 'side_lunge',
    analyzer: 'lunge', countingMode: 'reps_ai',
    muscles: ['legs', 'glutes'],
    difficulty: 2,
    met: 6.5,
    kcalPerUnit: 0.474,
    requiredJoints: FULL_BODY,
    cameraHint: 'front',
    alternatives: ['lunge', 'sumo_squat', 'squat'],
    demo: { rest: STAND, active: LUNGE_DOWN },
  },
  wall_sit: {
    id: 'wall_sit',
    analyzer: 'wall_sit', countingMode: 'hold_ai',
    muscles: ['legs'],
    difficulty: 1,
    met: 5,
    kcalPerUnit: 0.122,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['squat', 'glute_bridge', 'calf_raise'],
    demo: { rest: WALL_SIT, active: WALL_SIT },
  },
  calf_raise: {
    id: 'calf_raise',
    countingMode: 'timed',
    muscles: ['legs'],
    difficulty: 1,
    met: 4,
    kcalPerUnit: 0.097,
    requiredJoints: LOWER,
    cameraHint: 'side',
    alternatives: ['wall_sit', 'squat', 'jump_squat'],
    demo: { rest: STAND, active: STAND },
  },
  high_knees: {
    id: 'high_knees',
    analyzer: 'high_knees', countingMode: 'reps_ai',
    muscles: ['cardio', 'legs'],
    difficulty: 2,
    met: 9,
    kcalPerUnit: 0.328,
    requiredJoints: FULL_BODY,
    cameraHint: 'front',
    alternatives: ['butt_kicks', 'jumping_jack', 'mountain_climber'],
    demo: { rest: STAND, active: HIGH_KNEE },
  },
  pushup: {
    id: 'pushup',
    analyzer: 'pushup', countingMode: 'reps_ai',
    muscles: ['chest', 'arms', 'core'],
    difficulty: 2,
    met: 8,
    kcalPerUnit: 0.583,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['knee_pushup', 'wide_pushup', 'plank'],
    demo: { rest: PUSHUP_UP, active: PUSHUP_DOWN },
  },
  knee_pushup: {
    id: 'knee_pushup',
    analyzer: 'pushup', countingMode: 'reps_ai',
    muscles: ['chest', 'arms'],
    difficulty: 1,
    met: 5.5,
    kcalPerUnit: 0.401,
    requiredJoints: UPPER,
    cameraHint: 'side',
    alternatives: ['wall_pushup', 'pushup', 'plank'],
    demo: { rest: PUSHUP_UP, active: PUSHUP_DOWN },
  },
  wide_pushup: {
    id: 'wide_pushup',
    analyzer: 'pushup', countingMode: 'reps_ai',
    muscles: ['chest', 'arms'],
    difficulty: 2,
    met: 8,
    kcalPerUnit: 0.583,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['pushup', 'knee_pushup', 'diamond_pushup'],
    demo: { rest: PUSHUP_UP, active: PUSHUP_DOWN },
  },
  diamond_pushup: {
    id: 'diamond_pushup',
    analyzer: 'pushup', countingMode: 'reps_ai',
    muscles: ['arms', 'chest'],
    difficulty: 3,
    met: 8,
    kcalPerUnit: 0.583,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['pushup', 'floor_tricep_dip', 'pike_pushup'],
    demo: { rest: PUSHUP_UP, active: PUSHUP_DOWN },
  },
  wall_pushup: {
    id: 'wall_pushup',
    analyzer: 'wall_pushup', countingMode: 'reps_ai',
    muscles: ['chest', 'arms'],
    difficulty: 1,
    met: 3.5,
    kcalPerUnit: 0.255,
    requiredJoints: UPPER,
    cameraHint: 'side',
    alternatives: ['knee_pushup', 'pushup', 'arm_circles'],
    demo: { rest: WALL_PUSH, active: WALL_PUSH },
  },
  pike_pushup: {
    id: 'pike_pushup',
    analyzer: 'pike_pushup', countingMode: 'reps_ai',
    muscles: ['arms', 'chest', 'back'],
    difficulty: 3,
    met: 7,
    kcalPerUnit: 0.51,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['diamond_pushup', 'pushup', 'plank_up_down'],
    demo: { rest: PIKE, active: PIKE_DOWN },
  },
  floor_tricep_dip: {
    id: 'floor_tricep_dip',
    analyzer: 'tricep_dip', countingMode: 'reps_ai',
    muscles: ['arms'],
    difficulty: 2,
    met: 6,
    kcalPerUnit: 0.438,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['diamond_pushup', 'wall_pushup', 'pike_pushup'],
    demo: { rest: DIP_UP, active: DIP_DOWN },
  },
  arm_circles: {
    id: 'arm_circles',
    countingMode: 'timed',
    muscles: ['arms'],
    difficulty: 1,
    met: 4,
    kcalPerUnit: 0.097,
    requiredJoints: UPPER,
    cameraHint: 'front',
    alternatives: ['wall_pushup', 'plank_up_down', 'floor_tricep_dip'],
    demo: { rest: ARMS_OUT, active: ARMS_OUT },
  },
  plank_up_down: {
    id: 'plank_up_down',
    countingMode: 'timed',
    muscles: ['arms', 'core'],
    difficulty: 2,
    met: 7,
    kcalPerUnit: 0.17,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['pushup', 'plank', 'pike_pushup'],
    demo: { rest: PLANK, active: PUSHUP_UP },
  },
  situp: {
    id: 'situp',
    analyzer: 'situp', countingMode: 'reps_ai',
    muscles: ['core'],
    difficulty: 2,
    met: 6,
    kcalPerUnit: 0.438,
    requiredJoints: LYING,
    cameraHint: 'side',
    alternatives: ['crunch', 'leg_raise', 'plank'],
    demo: { rest: SITUP_DOWN, active: SITUP_UP },
  },
  crunch: {
    id: 'crunch',
    analyzer: 'crunch', countingMode: 'reps_ai',
    muscles: ['core'],
    difficulty: 1,
    met: 4.5,
    kcalPerUnit: 0.328,
    requiredJoints: LYING,
    cameraHint: 'side',
    alternatives: ['situp', 'dead_bug', 'plank'],
    demo: { rest: SITUP_DOWN, active: SITUP_UP },
  },
  bicycle_crunch: {
    id: 'bicycle_crunch',
    countingMode: 'timed',
    muscles: ['core'],
    difficulty: 2,
    met: 6,
    kcalPerUnit: 0.146,
    requiredJoints: LYING,
    cameraHint: 'side',
    alternatives: ['crunch', 'russian_twist', 'flutter_kick'],
    demo: { rest: SITUP_DOWN, active: LEG_RAISE_UP },
  },
  leg_raise: {
    id: 'leg_raise',
    analyzer: 'leg_raise', countingMode: 'reps_ai',
    muscles: ['core'],
    difficulty: 2,
    met: 5,
    kcalPerUnit: 0.365,
    requiredJoints: LYING,
    cameraHint: 'side',
    alternatives: ['flutter_kick', 'crunch', 'dead_bug'],
    demo: { rest: LYING_FLAT, active: LEG_RAISE_UP },
  },
  plank: {
    id: 'plank',
    analyzer: 'plank', countingMode: 'hold_ai',
    muscles: ['core'],
    difficulty: 1,
    met: 4,
    kcalPerUnit: 0.097,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['side_plank', 'dead_bug', 'glute_bridge'],
    demo: { rest: PLANK, active: PLANK },
  },
  side_plank: {
    id: 'side_plank',
    analyzer: 'plank', countingMode: 'hold_ai',
    muscles: ['core'],
    difficulty: 2,
    met: 4,
    kcalPerUnit: 0.097,
    requiredJoints: FULL_BODY,
    cameraHint: 'front',
    alternatives: ['plank', 'russian_twist', 'dead_bug'],
    demo: { rest: PLANK, active: PLANK },
  },
  mountain_climber: {
    id: 'mountain_climber',
    countingMode: 'timed',
    muscles: ['cardio', 'core'],
    difficulty: 2,
    met: 8.5,
    kcalPerUnit: 0.207,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['plank_jack', 'high_knees', 'bear_crawl'],
    demo: { rest: MC_REST, active: MC_ACTIVE },
  },
  flutter_kick: {
    id: 'flutter_kick',
    countingMode: 'timed',
    muscles: ['core'],
    difficulty: 2,
    met: 5,
    kcalPerUnit: 0.122,
    requiredJoints: LYING,
    cameraHint: 'side',
    alternatives: ['leg_raise', 'bicycle_crunch', 'dead_bug'],
    demo: { rest: LYING_FLAT, active: LEG_RAISE_UP },
  },
  russian_twist: {
    id: 'russian_twist',
    countingMode: 'timed',
    muscles: ['core'],
    difficulty: 2,
    met: 5,
    kcalPerUnit: 0.122,
    requiredJoints: LYING,
    cameraHint: 'front',
    alternatives: ['bicycle_crunch', 'crunch', 'side_plank'],
    demo: { rest: SITUP_UP, active: SITUP_UP },
  },
  dead_bug: {
    id: 'dead_bug',
    countingMode: 'timed',
    muscles: ['core', 'back'],
    difficulty: 1,
    met: 3.5,
    kcalPerUnit: 0.085,
    requiredJoints: LYING,
    cameraHint: 'side',
    alternatives: ['bird_dog', 'crunch', 'plank'],
    demo: { rest: LYING_FLAT, active: LEG_RAISE_UP },
  },
  glute_bridge: {
    id: 'glute_bridge',
    analyzer: 'glute_bridge', countingMode: 'reps_ai',
    muscles: ['glutes', 'core'],
    difficulty: 1,
    met: 4,
    kcalPerUnit: 0.292,
    requiredJoints: LYING,
    cameraHint: 'side',
    alternatives: ['single_leg_bridge', 'squat', 'donkey_kick'],
    demo: { rest: BRIDGE_DOWN, active: BRIDGE_UP },
  },
  single_leg_bridge: {
    id: 'single_leg_bridge',
    analyzer: 'glute_bridge', countingMode: 'reps_ai',
    muscles: ['glutes', 'core'],
    difficulty: 2,
    met: 5,
    kcalPerUnit: 0.365,
    requiredJoints: LYING,
    cameraHint: 'side',
    alternatives: ['glute_bridge', 'donkey_kick', 'lunge'],
    demo: { rest: BRIDGE_DOWN, active: BRIDGE_UP },
  },
  donkey_kick: {
    id: 'donkey_kick',
    countingMode: 'timed',
    muscles: ['glutes'],
    difficulty: 1,
    met: 4,
    kcalPerUnit: 0.097,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['fire_hydrant', 'glute_bridge', 'bird_dog'],
    demo: { rest: CRAWL, active: CRAWL },
  },
  fire_hydrant: {
    id: 'fire_hydrant',
    countingMode: 'timed',
    muscles: ['glutes'],
    difficulty: 1,
    met: 3.5,
    kcalPerUnit: 0.085,
    requiredJoints: FULL_BODY,
    cameraHint: 'front',
    alternatives: ['donkey_kick', 'glute_bridge', 'side_lunge'],
    demo: { rest: CRAWL, active: CRAWL },
  },
  superman: {
    id: 'superman',
    countingMode: 'timed',
    muscles: ['back', 'glutes'],
    difficulty: 1,
    met: 3.5,
    kcalPerUnit: 0.085,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['swimmer', 'bird_dog', 'reverse_snow_angel'],
    demo: { rest: PRONE, active: SUPERMAN },
  },
  bird_dog: {
    id: 'bird_dog',
    countingMode: 'timed',
    muscles: ['back', 'core'],
    difficulty: 1,
    met: 3.5,
    kcalPerUnit: 0.085,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['dead_bug', 'superman', 'plank'],
    demo: { rest: CRAWL, active: CRAWL },
  },
  reverse_snow_angel: {
    id: 'reverse_snow_angel',
    countingMode: 'timed',
    muscles: ['back'],
    difficulty: 1,
    met: 3.5,
    kcalPerUnit: 0.085,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['superman', 'prone_y_raise', 'swimmer'],
    demo: { rest: PRONE, active: SUPERMAN },
  },
  swimmer: {
    id: 'swimmer',
    countingMode: 'timed',
    muscles: ['back', 'glutes'],
    difficulty: 2,
    met: 4,
    kcalPerUnit: 0.097,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['superman', 'reverse_snow_angel', 'bird_dog'],
    demo: { rest: PRONE, active: SUPERMAN },
  },
  good_morning: {
    id: 'good_morning',
    analyzer: 'hip_hinge', countingMode: 'reps_ai',
    muscles: ['back', 'glutes', 'legs'],
    difficulty: 1,
    met: 5,
    kcalPerUnit: 0.365,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['superman', 'glute_bridge', 'squat'],
    demo: { rest: STAND, active: HINGE },
  },
  prone_y_raise: {
    id: 'prone_y_raise',
    countingMode: 'timed',
    muscles: ['back'],
    difficulty: 1,
    met: 3.5,
    kcalPerUnit: 0.085,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['superman', 'reverse_snow_angel', 'swimmer'],
    demo: { rest: PRONE, active: SUPERMAN },
  },
  jumping_jack: {
    id: 'jumping_jack',
    analyzer: 'jumping_jack', countingMode: 'reps_ai',
    muscles: ['cardio', 'full_body'],
    difficulty: 1,
    met: 8,
    kcalPerUnit: 0.292,
    requiredJoints: [...FULL_BODY, 'left_wrist', 'right_wrist'],
    cameraHint: 'front',
    alternatives: ['high_knees', 'plank_jack', 'skater_jump'],
    demo: { rest: JJ_CLOSED, active: JJ_OPEN },
  },
  burpee: {
    id: 'burpee',
    countingMode: 'timed',
    muscles: ['full_body', 'cardio'],
    difficulty: 3,
    met: 10,
    kcalPerUnit: 0.243,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['squat_thrust', 'jumping_jack', 'mountain_climber'],
    demo: { rest: STAND, active: BURPEE_ACTIVE },
  },
  squat_thrust: {
    id: 'squat_thrust',
    countingMode: 'timed',
    muscles: ['full_body', 'cardio'],
    difficulty: 2,
    met: 9,
    kcalPerUnit: 0.219,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['burpee', 'mountain_climber', 'jump_squat'],
    demo: { rest: SQUAT_DOWN, active: PUSHUP_UP },
  },
  bear_crawl: {
    id: 'bear_crawl',
    countingMode: 'timed',
    muscles: ['full_body', 'core'],
    difficulty: 2,
    met: 7,
    kcalPerUnit: 0.17,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['mountain_climber', 'inchworm', 'plank_up_down'],
    demo: { rest: CRAWL, active: CRAWL },
  },
  inchworm: {
    id: 'inchworm',
    countingMode: 'timed',
    muscles: ['full_body', 'core'],
    difficulty: 2,
    met: 6,
    kcalPerUnit: 0.146,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['bear_crawl', 'plank_up_down', 'burpee'],
    demo: { rest: HINGE, active: PUSHUP_UP },
  },
  plank_jack: {
    id: 'plank_jack',
    countingMode: 'timed',
    muscles: ['cardio', 'core', 'full_body'],
    difficulty: 2,
    met: 8,
    kcalPerUnit: 0.194,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['mountain_climber', 'jumping_jack', 'plank'],
    demo: { rest: PLANK, active: PLANK },
  },
  butt_kicks: {
    id: 'butt_kicks',
    countingMode: 'timed',
    muscles: ['cardio', 'legs'],
    difficulty: 1,
    met: 8,
    kcalPerUnit: 0.194,
    requiredJoints: FULL_BODY,
    cameraHint: 'side',
    alternatives: ['high_knees', 'jumping_jack', 'skater_jump'],
    demo: { rest: STAND, active: BUTT_KICK },
  },
  skater_jump: {
    id: 'skater_jump',
    countingMode: 'timed',
    muscles: ['cardio', 'legs', 'glutes'],
    difficulty: 2,
    met: 8,
    kcalPerUnit: 0.194,
    requiredJoints: FULL_BODY,
    cameraHint: 'front',
    alternatives: ['jump_squat', 'side_lunge', 'jumping_jack'],
    demo: { rest: SKATER, active: SKATER },
  },
};
export const EXERCISE_IDS = Object.keys(EXERCISES);

export function getExercise(id: string): Exercise {
  const ex = EXERCISES[id];
  if (!ex) throw new Error(`Unknown exercise ${id}`);
  return ex;
}

/** Exercises grouped by muscle, in library order. */
export function exercisesByMuscle(group: MuscleGroup): Exercise[] {
  return Object.values(EXERCISES).filter((e) => e.muscles.includes(group));
}
