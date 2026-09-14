import { MuscleGroup } from './exercises';

export type BodySide = 'front' | 'back';

/** An ellipse in the body image's coordinate space (688 x 1024). */
export interface Region {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Rotation in degrees around the centre. */
  rotate?: number;
}

/**
 * Highlight shapes per muscle group, drawn over the generated body illustration.
 * Coordinates were read off the artwork, so they must stay in sync with
 * assets/body/body-front.png and body-back.png (both 688 x 1024).
 */
export const BODY_VIEWBOX = { width: 688, height: 1024 } as const;

export const BODY_REGIONS: Record<BodySide, Partial<Record<MuscleGroup, Region[]>>> = {
  front: {
    chest: [
      { cx: 314, cy: 235, rx: 36, ry: 43 },
      { cx: 377, cy: 235, rx: 36, ry: 43 },
    ],
    arms: [
      { cx: 238, cy: 224, rx: 33, ry: 41 },
      { cx: 452, cy: 224, rx: 33, ry: 41 },
      { cx: 222, cy: 325, rx: 28, ry: 64 },
      { cx: 468, cy: 325, rx: 28, ry: 64 },
      { cx: 200, cy: 446, rx: 26, ry: 60, rotate: 6 },
      { cx: 490, cy: 446, rx: 26, ry: 60, rotate: -6 },
    ],
    core: [
      { cx: 345, cy: 332, rx: 50, ry: 48 },
      { cx: 345, cy: 422, rx: 48, ry: 50 },
      { cx: 277, cy: 372, rx: 18, ry: 56 },
      { cx: 413, cy: 372, rx: 18, ry: 56 },
    ],
    legs: [
      { cx: 294, cy: 612, rx: 49, ry: 106 },
      { cx: 396, cy: 612, rx: 49, ry: 106 },
      { cx: 290, cy: 850, rx: 37, ry: 86 },
      { cx: 400, cy: 850, rx: 37, ry: 86 },
    ],
  },
  back: {
    back: [
      { cx: 345, cy: 185, rx: 48, ry: 32 },
      { cx: 345, cy: 288, rx: 72, ry: 70 },
      { cx: 345, cy: 400, rx: 54, ry: 54 },
    ],
    arms: [
      { cx: 240, cy: 232, rx: 33, ry: 40 },
      { cx: 450, cy: 232, rx: 33, ry: 40 },
      { cx: 224, cy: 330, rx: 28, ry: 62 },
      { cx: 466, cy: 330, rx: 28, ry: 62 },
      { cx: 197, cy: 452, rx: 26, ry: 60, rotate: 6 },
      { cx: 493, cy: 452, rx: 26, ry: 60, rotate: -6 },
    ],
    glutes: [
      { cx: 303, cy: 500, rx: 52, ry: 57 },
      { cx: 387, cy: 500, rx: 52, ry: 57 },
    ],
    legs: [
      { cx: 296, cy: 648, rx: 50, ry: 94 },
      { cx: 394, cy: 648, rx: 50, ry: 94 },
      { cx: 288, cy: 850, rx: 39, ry: 88 },
      { cx: 402, cy: 850, rx: 39, ry: 88 },
    ],
  },
};

/** Muscle groups that have a shape on this side of the body. */
export function groupsOnSide(side: BodySide): MuscleGroup[] {
  return Object.keys(BODY_REGIONS[side]) as MuscleGroup[];
}

/** Whole-body groups highlight every region on the current side. */
export const WHOLE_BODY_GROUPS: MuscleGroup[] = ['full_body', 'cardio'];
