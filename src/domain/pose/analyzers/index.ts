import { AngleRepCounter, ExerciseAnalyzer, HoldAnalyzer } from '../repEngine';
import { Pose, getKeypoint } from '../types';
import {
  backStraightCheck,
  bodyLineAngle,
  bodyStraightCheck,
  elbowAngle,
  hipAngle,
  kneeAngle,
  shoulderWidth,
  torsoLean,
  torsoLength,
  visible,
} from './common';

export type AnalyzerId =
  | 'squat'
  | 'pushup'
  | 'lunge'
  | 'situp'
  | 'jumping_jack'
  | 'glute_bridge'
  | 'plank'
  | 'wall_sit'
  | 'high_knees'
  | 'wall_pushup'
  | 'pike_pushup'
  | 'tricep_dip'
  | 'crunch'
  | 'leg_raise'
  | 'hip_hinge';

export function createSquatAnalyzer(): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: kneeAngle,
    activeDirection: 'decreasing',
    activeThreshold: 100,
    restThreshold: 160,
    partialThreshold: 140,
    partialFeedback: 'go_lower',
    formChecks: [{ when: 'active', check: backStraightCheck(50) }],
  });
}

export function createPushupAnalyzer(): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: elbowAngle,
    activeDirection: 'decreasing',
    activeThreshold: 95,
    restThreshold: 155,
    partialThreshold: 135,
    partialFeedback: 'go_lower',
    formChecks: [{ when: 'always', check: bodyStraightCheck(155) }],
  });
}

export function createLungeAnalyzer(): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: kneeAngle,
    activeDirection: 'decreasing',
    activeThreshold: 105,
    restThreshold: 160,
    partialThreshold: 140,
    partialFeedback: 'go_lower',
    formChecks: [{ when: 'active', check: backStraightCheck(35) }],
  });
}

export function createSitupAnalyzer(): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: hipAngle,
    activeDirection: 'decreasing',
    activeThreshold: 95,
    restThreshold: 140,
    partialThreshold: 125,
    partialFeedback: 'lift_higher',
  });
}

/** Ratio of ankle spread to shoulder width; arms must be over the head at the top. */
function jumpingJackSpread(pose: Pose): number | null {
  if (!visible(pose, ['left_ankle', 'right_ankle', 'left_shoulder', 'right_shoulder'])) return null;
  const la = getKeypoint(pose, 'left_ankle');
  const ra = getKeypoint(pose, 'right_ankle');
  const sw = shoulderWidth(pose) || 1e-6;
  return Math.abs(la.x - ra.x) / sw;
}

export function createJumpingJackAnalyzer(): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: jumpingJackSpread,
    activeDirection: 'increasing',
    activeThreshold: 1.7,
    restThreshold: 1.15,
    partialThreshold: 1.4,
    partialFeedback: 'feet_wider',
    minRepDurationMs: 250,
    formChecks: [
      {
        when: 'active',
        check: (pose) => {
          if (!visible(pose, ['left_wrist', 'right_wrist', 'nose'])) return null;
          const nose = getKeypoint(pose, 'nose');
          const lw = getKeypoint(pose, 'left_wrist');
          const rw = getKeypoint(pose, 'right_wrist');
          // y grows downwards: wrists must be above the nose.
          return lw.y < nose.y && rw.y < nose.y ? null : 'raise_arms_higher';
        },
      },
    ],
  });
}

export function createGluteBridgeAnalyzer(): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: hipAngle,
    activeDirection: 'increasing',
    activeThreshold: 165,
    restThreshold: 140,
    partialThreshold: 150,
    partialFeedback: 'lift_higher',
  });
}

/** Height of the higher knee relative to the hips, in torso lengths (positive = knee above hip). */
function kneeLift(pose: Pose): number | null {
  if (!visible(pose, ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_shoulder', 'right_shoulder'])) return null;
  const hipY = (getKeypoint(pose, 'left_hip').y + getKeypoint(pose, 'right_hip').y) / 2;
  const kneeY = Math.min(getKeypoint(pose, 'left_knee').y, getKeypoint(pose, 'right_knee').y);
  const t = torsoLength(pose) || 1e-6;
  return (hipY - kneeY) / t;
}

export function createHighKneesAnalyzer(): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: kneeLift,
    activeDirection: 'increasing',
    activeThreshold: -0.15,
    restThreshold: -0.55,
    partialThreshold: -0.35,
    partialFeedback: 'lift_higher',
    minRepDurationMs: 150,
    confirmFrames: 1,
  });
}

export function createPlankAnalyzer(): ExerciseAnalyzer {
  return new HoldAnalyzer({
    inPosition: (pose) => {
      const a = bodyLineAngle(pose);
      if (a === null) return null;
      return a >= 160;
    },
    formChecks: [{ when: 'always', check: bodyStraightCheck(160) }],
  });
}

export function createWallSitAnalyzer(): ExerciseAnalyzer {
  return new HoldAnalyzer({
    inPosition: (pose) => {
      const a = kneeAngle(pose);
      if (a === null) return null;
      return a >= 70 && a <= 115;
    },
    formChecks: [
      {
        when: 'always',
        check: (pose) => {
          const a = kneeAngle(pose);
          return a !== null && a > 115 ? 'go_lower' : null;
        },
      },
    ],
  });
}

/** Elbow-driven presses with no body-line requirement (wall push-up, pike push-up, floor dips). */
function createElbowRepAnalyzer(active: number, rest: number): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: elbowAngle,
    activeDirection: 'decreasing',
    activeThreshold: active,
    restThreshold: rest,
    partialThreshold: rest - 20,
    partialFeedback: 'go_lower',
  });
}

export function createWallPushupAnalyzer(): ExerciseAnalyzer {
  return createElbowRepAnalyzer(100, 150);
}

export function createPikePushupAnalyzer(): ExerciseAnalyzer {
  return createElbowRepAnalyzer(100, 150);
}

export function createTricepDipAnalyzer(): ExerciseAnalyzer {
  return createElbowRepAnalyzer(95, 150);
}

/** Crunch: a smaller trunk curl than a sit-up. */
export function createCrunchAnalyzer(): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: hipAngle,
    activeDirection: 'decreasing',
    activeThreshold: 135,
    restThreshold: 155,
    partialThreshold: 148,
    partialFeedback: 'lift_higher',
  });
}

/** Lying leg raise: hip angle closes as the legs come up. */
export function createLegRaiseAnalyzer(): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: hipAngle,
    activeDirection: 'decreasing',
    activeThreshold: 100,
    restThreshold: 160,
    partialThreshold: 135,
    partialFeedback: 'lift_higher',
  });
}

/** Hip hinge (good morning): torso lean from vertical grows as the athlete bows forward. */
export function createHipHingeAnalyzer(): ExerciseAnalyzer {
  return new AngleRepCounter({
    metric: torsoLean,
    activeDirection: 'increasing',
    activeThreshold: 55,
    restThreshold: 20,
    partialThreshold: 40,
    partialFeedback: 'go_lower',
    formChecks: [
      {
        when: 'active',
        check: (pose) => {
          const k = kneeAngle(pose);
          return k !== null && k < 140 ? 'full_extension' : null;
        },
      },
    ],
  });
}

const FACTORIES: Record<AnalyzerId, () => ExerciseAnalyzer> = {
  squat: createSquatAnalyzer,
  pushup: createPushupAnalyzer,
  lunge: createLungeAnalyzer,
  situp: createSitupAnalyzer,
  jumping_jack: createJumpingJackAnalyzer,
  glute_bridge: createGluteBridgeAnalyzer,
  plank: createPlankAnalyzer,
  wall_sit: createWallSitAnalyzer,
  high_knees: createHighKneesAnalyzer,
  wall_pushup: createWallPushupAnalyzer,
  pike_pushup: createPikePushupAnalyzer,
  tricep_dip: createTricepDipAnalyzer,
  crunch: createCrunchAnalyzer,
  leg_raise: createLegRaiseAnalyzer,
  hip_hinge: createHipHingeAnalyzer,
};

export function createAnalyzer(id: AnalyzerId): ExerciseAnalyzer {
  return FACTORIES[id]();
}
