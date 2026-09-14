import { KeypointName, Pose, getKeypoint } from './types';

export type FramingStatus =
  | 'ok'
  | 'no_person'
  | 'move_back'
  | 'move_closer'
  | 'move_left'
  | 'move_right'
  | 'head_cut'
  | 'feet_cut';

export interface FramingResult {
  status: FramingStatus;
  /** Normalised bounding box of the confidently detected joints. */
  box: { minX: number; minY: number; maxX: number; maxY: number } | null;
  /** 0..1 – fraction of required joints that are visible. */
  coverage: number;
}

export interface FramingOptions {
  /** Joints that must be visible for the exercise. */
  required: KeypointName[];
  /** Minimum keypoint score to be considered visible. */
  minScore?: number;
  /** Safe area inside the frame, as normalised margins. */
  margin?: number;
  /** Body must occupy at least this fraction of the frame height to be "close enough". */
  minHeight?: number;
}

const DEFAULT_MARGIN = 0.04;
const DEFAULT_MIN_HEIGHT = 0.45;

/**
 * Decides whether the person is fully inside the camera frame and gives a
 * single actionable correction if not.
 */
export function evaluateFraming(pose: Pose | null, options: FramingOptions): FramingResult {
  const minScore = options.minScore ?? 0.3;
  const margin = options.margin ?? DEFAULT_MARGIN;
  const minHeight = options.minHeight ?? DEFAULT_MIN_HEIGHT;

  if (!pose) return { status: 'no_person', box: null, coverage: 0 };

  const visible = options.required.filter((n) => getKeypoint(pose, n).score >= minScore);
  const coverage = visible.length / options.required.length;
  if (coverage < 0.4) return { status: 'no_person', box: null, coverage };

  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const name of visible) {
    const k = getKeypoint(pose, name);
    minX = Math.min(minX, k.x);
    minY = Math.min(minY, k.y);
    maxX = Math.max(maxX, k.x);
    maxY = Math.max(maxY, k.y);
  }
  const box = { minX, minY, maxX, maxY };

  // Missing joints tell us what part of the body is cut off.
  const missing = options.required.filter((n) => getKeypoint(pose, n).score < minScore);
  const lowerMissing = missing.filter((n) => n.includes('ankle') || n.includes('knee'));
  const upperMissing = missing.filter((n) => n === 'nose' || n.includes('eye') || n.includes('shoulder'));

  if (lowerMissing.length >= 2 || maxY > 1 - margin) {
    return { status: 'feet_cut', box, coverage };
  }
  if (upperMissing.length >= 2 || minY < margin) {
    return { status: 'head_cut', box, coverage };
  }
  if (minX < margin) return { status: 'move_right', box, coverage };
  if (maxX > 1 - margin) return { status: 'move_left', box, coverage };
  if (maxY - minY > 1 - 2 * margin) return { status: 'move_back', box, coverage };
  if (coverage < 1) return { status: 'move_back', box, coverage };
  if (maxY - minY < minHeight) return { status: 'move_closer', box, coverage };
  return { status: 'ok', box, coverage };
}
