import { Keypoint, Pose } from './types';

export interface ViewMapping {
  /** Size of the on-screen preview in points. */
  viewWidth: number;
  viewHeight: number;
  /** Size of the *image the model saw* after rotation to upright orientation. */
  imageWidth: number;
  imageHeight: number;
  /** Mirror horizontally (front camera preview). */
  mirror: boolean;
  /** How the preview is fitted into the view. */
  resizeMode: 'cover' | 'contain';
}

/**
 * Convert normalised keypoints (relative to the square model input, which was
 * produced by *stretching* the upright camera image) into view pixels.
 *
 * The camera preview keeps the aspect ratio of the image, so we undo the
 * stretch first, then apply the same "cover"/"contain" fit the preview uses.
 */
export function mapPoseToView(pose: Pose, m: ViewMapping): Pose {
  const imageAspect = m.imageWidth / m.imageHeight;
  const viewAspect = m.viewWidth / m.viewHeight;

  let scale: number;
  if (m.resizeMode === 'cover') {
    scale = imageAspect > viewAspect ? m.viewHeight / m.imageHeight : m.viewWidth / m.imageWidth;
  } else {
    scale = imageAspect > viewAspect ? m.viewWidth / m.imageWidth : m.viewHeight / m.imageHeight;
  }
  const drawnWidth = m.imageWidth * scale;
  const drawnHeight = m.imageHeight * scale;
  const offsetX = (m.viewWidth - drawnWidth) / 2;
  const offsetY = (m.viewHeight - drawnHeight) / 2;

  const keypoints: Keypoint[] = pose.keypoints.map((k) => {
    const nx = m.mirror ? 1 - k.x : k.x;
    return {
      ...k,
      x: offsetX + nx * drawnWidth,
      y: offsetY + k.y * drawnHeight,
    };
  });
  return { ...pose, keypoints };
}
