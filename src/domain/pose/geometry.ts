import { getKeypoint, Keypoint, KeypointName, Pose } from './types';

export interface Point {
  x: number;
  y: number;
}

/** Interior angle (degrees, 0..180) at vertex `b` formed by a-b-c. */
export function angleBetween(a: Point, b: Point, c: Point): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);
  if (magAB === 0 || magCB === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Angle of segment a->b relative to the vertical axis (0 = perfectly vertical). */
export function angleFromVertical(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return 0;
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;
}

/** Angle of segment a->b relative to the horizontal axis (0 = perfectly horizontal). */
export function angleFromHorizontal(a: Point, b: Point): number {
  return 90 - angleFromVertical(a, b);
}

export function jointAngle(pose: Pose, a: KeypointName, b: KeypointName, c: KeypointName): number {
  return angleBetween(getKeypoint(pose, a), getKeypoint(pose, b), getKeypoint(pose, c));
}

export function minScore(pose: Pose, names: KeypointName[]): number {
  return names.reduce((m, n) => Math.min(m, getKeypoint(pose, n).score), 1);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Pick the better-visible side of the body for a symmetric measurement.
 * Returns 'left' or 'right' based on the summed confidence of the given joints.
 */
export function betterSide(pose: Pose, joints: Array<[KeypointName, KeypointName]>): 'left' | 'right' {
  let left = 0;
  let right = 0;
  for (const [l, r] of joints) {
    left += getKeypoint(pose, l).score;
    right += getKeypoint(pose, r).score;
  }
  return left >= right ? 'left' : 'right';
}

/**
 * Exponential moving average smoother for keypoints; reduces jitter before
 * angle computation without adding much latency.
 */
export class PoseSmoother {
  private previous: Keypoint[] | null = null;

  constructor(private readonly alpha = 0.6) {}

  reset(): void {
    this.previous = null;
  }

  smooth(pose: Pose): Pose {
    if (!this.previous) {
      this.previous = pose.keypoints.map((k) => ({ ...k }));
      return pose;
    }
    const prev = this.previous;
    const keypoints = pose.keypoints.map((k, i) => {
      const p = prev[i] ?? k;
      // Low-confidence detections should not pull the smoothed value around.
      const a = k.score < 0.2 ? this.alpha * 0.3 : this.alpha;
      return {
        name: k.name,
        x: p.x + (k.x - p.x) * a,
        y: p.y + (k.y - p.y) * a,
        score: k.score,
      };
    });
    this.previous = keypoints;
    return { ...pose, keypoints };
  }
}
