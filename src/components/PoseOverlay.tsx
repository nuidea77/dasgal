import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Pose, SKELETON_EDGES, getKeypoint } from '@/domain/pose/types';
import { colors } from '@/theme';

interface Props {
  /** Pose already mapped to view pixel coordinates. */
  pose: Pose | null;
  width: number;
  height: number;
  /** Colour hint: good form → accent, correction active → danger. */
  bad?: boolean;
  minScore?: number;
}

/** Draws the detected skeleton. Rendered with SVG, cheap enough for 30fps updates. */
function PoseOverlayImpl({ pose, width, height, bad, minScore = 0.3 }: Props) {
  if (!pose) return null;
  const stroke = bad ? colors.skeletonBad : colors.skeleton;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {SKELETON_EDGES.map(([a, b]) => {
        const ka = getKeypoint(pose, a);
        const kb = getKeypoint(pose, b);
        if (ka.score < minScore || kb.score < minScore) return null;
        return <Line key={`${a}-${b}`} x1={ka.x} y1={ka.y} x2={kb.x} y2={kb.y} stroke={stroke} strokeWidth={4} strokeLinecap="round" opacity={0.9} />;
      })}
      {pose.keypoints.map((k) =>
        k.score < minScore ? null : <Circle key={k.name} cx={k.x} cy={k.y} r={6} fill={colors.white} stroke={stroke} strokeWidth={3} />,
      )}
    </Svg>
  );
}

export const PoseOverlay = memo(PoseOverlayImpl);
