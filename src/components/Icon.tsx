import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { colors } from '@/theme';

export type IconName =
  | 'calendar'
  | 'trophy'
  | 'settings'
  | 'lock'
  | 'flame'
  | 'bolt'
  | 'star'
  | 'award'
  | 'target'
  | 'graduation'
  | 'dumbbell'
  | 'heart'
  | 'activity'
  | 'timer'
  | 'cpu'
  | 'camera'
  | 'lightbulb'
  | 'check'
  | 'close'
  | 'moon'
  | 'sparkles'
  | 'party'
  | 'trending'
  | 'arrowUp'
  | 'legs'
  | 'hundred'
  | 'user';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Stroke-style line icons (24×24 grid), rendered with react-native-svg. No emoji dependency. */
export function Icon({ name, size = 22, color = colors.text, strokeWidth = 2 }: Props) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {glyph(name, p)}
    </Svg>
  );
}

type P = { stroke: string; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round'; fill: string };

function glyph(name: IconName, p: P): React.ReactNode {
  switch (name) {
    case 'calendar':
      return (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={3} {...p} />
          <Line x1={3} y1={10} x2={21} y2={10} {...p} />
          <Line x1={8} y1={3} x2={8} y2={7} {...p} />
          <Line x1={16} y1={3} x2={16} y2={7} {...p} />
        </>
      );
    case 'trophy':
      return (
        <>
          <Path d="M8 4h8v6a4 4 0 0 1-8 0V4z" {...p} />
          <Path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" {...p} />
          <Line x1={12} y1={14} x2={12} y2={18} {...p} />
          <Line x1={8} y1={20} x2={16} y2={20} {...p} />
        </>
      );
    case 'settings':
      return (
        <>
          <Circle cx={12} cy={12} r={3} {...p} />
          <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" {...p} />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x={4} y={11} width={16} height={10} rx={2} {...p} />
          <Path d="M8 11V7a4 4 0 0 1 8 0v4" {...p} />
        </>
      );
    case 'flame':
      return <Path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-6-.5 2-1.5 3-2.5 3.5C14 9 13 5 9 3c.5 4-1 6-2.5 8S4 14 4 15.5C4 19 7.5 22 12 22z" {...p} />;
    case 'bolt':
      return <Path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" {...p} />;
    case 'star':
      return <Path d="m12 2 3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8z" {...p} />;
    case 'award':
      return (
        <>
          <Circle cx={12} cy={9} r={6} {...p} />
          <Path d="m8.5 14-1.5 8 5-3 5 3-1.5-8" {...p} />
        </>
      );
    case 'target':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Circle cx={12} cy={12} r={5} {...p} />
          <Circle cx={12} cy={12} r={1} {...p} />
        </>
      );
    case 'graduation':
      return (
        <>
          <Path d="M2 9l10-5 10 5-10 5z" {...p} />
          <Path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" {...p} />
          <Line x1={22} y1={9} x2={22} y2={15} {...p} />
        </>
      );
    case 'dumbbell':
      return (
        <>
          <Rect x={2} y={9} width={3} height={6} rx={1} {...p} />
          <Rect x={5} y={7} width={3} height={10} rx={1} {...p} />
          <Rect x={16} y={7} width={3} height={10} rx={1} {...p} />
          <Rect x={19} y={9} width={3} height={6} rx={1} {...p} />
          <Line x1={8} y1={12} x2={16} y2={12} {...p} />
        </>
      );
    case 'heart':
      return <Path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" {...p} />;
    case 'activity':
      return <Polyline points="2 12 6 12 9 4 15 20 18 12 22 12" {...p} />;
    case 'timer':
      return (
        <>
          <Circle cx={12} cy={13} r={8} {...p} />
          <Line x1={12} y1={9} x2={12} y2={13} {...p} />
          <Line x1={9} y1={2} x2={15} y2={2} {...p} />
          <Line x1={12} y1={2} x2={12} y2={5} {...p} />
        </>
      );
    case 'cpu':
      return (
        <>
          <Rect x={5} y={5} width={14} height={14} rx={2} {...p} />
          <Rect x={9} y={9} width={6} height={6} rx={1} {...p} />
          <Path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" {...p} />
        </>
      );
    case 'camera':
      return (
        <>
          <Path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" {...p} />
          <Circle cx={12} cy={13} r={3.5} {...p} />
        </>
      );
    case 'lightbulb':
      return (
        <>
          <Path d="M9 18h6M10 21h4" {...p} />
          <Path d="M8.5 14a6 6 0 1 1 7 0c-.8.7-1.5 1.5-1.5 2.5v.5h-4V16.5c0-1-.7-1.8-1.5-2.5z" {...p} />
        </>
      );
    case 'check':
      return <Polyline points="4 12.5 9.5 18 20 6" {...p} />;
    case 'close':
      return (
        <>
          <Line x1={6} y1={6} x2={18} y2={18} {...p} />
          <Line x1={18} y1={6} x2={6} y2={18} {...p} />
        </>
      );
    case 'moon':
      return <Path d="M21 13.5A8.5 8.5 0 0 1 10.5 3a7 7 0 1 0 10.5 10.5z" {...p} />;
    case 'sparkles':
      return (
        <>
          <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" {...p} />
          <Path d="M5 17l.8 2.2L8 20l-2.2.8L5 23l-.8-2.2L2 20l2.2-.8z" {...p} />
        </>
      );
    case 'party':
      return (
        <>
          <Path d="M4 21l4-13 9 9z" {...p} />
          <Path d="M13 5l1-2M17 8l2-1M15 12l3 1M11 3l.5 3" {...p} />
        </>
      );
    case 'trending':
      return (
        <>
          <Polyline points="3 17 9 11 13 15 21 7" {...p} />
          <Polyline points="15 7 21 7 21 13" {...p} />
        </>
      );
    case 'arrowUp':
      return (
        <>
          <Line x1={12} y1={20} x2={12} y2={4} {...p} />
          <Polyline points="5 11 12 4 19 11" {...p} />
        </>
      );
    case 'legs':
      return (
        <>
          <Path d="M9 3v7l-3 6v5" {...p} />
          <Path d="M15 3v7l3 6v5" {...p} />
          <Line x1={9} y1={3} x2={15} y2={3} {...p} />
          <Line x1={4} y1={21} x2={8} y2={21} {...p} />
          <Line x1={16} y1={21} x2={20} y2={21} {...p} />
        </>
      );
    case 'hundred':
      return (
        <>
          <Path d="M3 9v6M2 9h1" {...p} />
          <Rect x={7} y={8} width={5} height={8} rx={2.5} {...p} />
          <Rect x={15} y={8} width={5} height={8} rx={2.5} {...p} />
        </>
      );
    case 'user':
      return (
        <>
          <Circle cx={12} cy={8} r={4} {...p} />
          <Path d="M4 21a8 8 0 0 1 16 0" {...p} />
        </>
      );
    default:
      return null;
  }
}
