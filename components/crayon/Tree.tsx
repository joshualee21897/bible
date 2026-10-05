import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, FeDisplacementMap, FeTurbulence, Filter, G, Line, Rect } from 'react-native-svg';

import { CRAYON_COLORS } from '../../lib/theme-crayon';
import type { TreeStage } from '../../lib/tree';

type Props = { stage: TreeStage; size?: number };

const TRUNK = '#8B5A34';

// One hand-drawn illustration per growth stage — a placeholder for real
// illustrated art later; swap this file out when that's ready.
export function Tree({ stage, size = 72 }: Props) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `crayon-tree-${rawId}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <Filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <FeTurbulence type="fractalNoise" baseFrequency={0.02} numOctaves={2} seed={5} result="noise" />
            <FeDisplacementMap in="SourceGraphic" in2="noise" scale={3} />
          </Filter>
        </Defs>
        <G filter={`url(#${filterId})`}>
          <Line x1={15} y1={88} x2={85} y2={88} stroke={CRAYON_COLORS.ink} strokeWidth={2} opacity={0.35} />

          {stage === 'seed' && (
            <Ellipse cx={50} cy={84} rx={7} ry={5} fill={TRUNK} stroke={CRAYON_COLORS.ink} strokeWidth={2} />
          )}

          {stage === 'sprout' && (
            <>
              <Rect x={48} y={66} width={4} height={20} fill={TRUNK} />
              <Ellipse cx={41} cy={64} rx={9} ry={5.5} fill={CRAYON_COLORS.sage} stroke={CRAYON_COLORS.ink} strokeWidth={2} />
              <Ellipse cx={59} cy={66} rx={9} ry={5.5} fill={CRAYON_COLORS.sage} stroke={CRAYON_COLORS.ink} strokeWidth={2} />
            </>
          )}

          {stage === 'sapling' && (
            <>
              <Rect x={47} y={52} width={6} height={36} fill={TRUNK} stroke={CRAYON_COLORS.ink} strokeWidth={1.5} />
              <Circle cx={50} cy={42} r={20} fill={CRAYON_COLORS.sage} stroke={CRAYON_COLORS.ink} strokeWidth={2.6} />
            </>
          )}

          {(stage === 'tree' || stage === 'fruiting') && (
            <>
              <Rect x={44} y={48} width={12} height={40} fill={TRUNK} stroke={CRAYON_COLORS.ink} strokeWidth={1.5} />
              <Circle cx={50} cy={38} r={28} fill={CRAYON_COLORS.sage} stroke={CRAYON_COLORS.ink} strokeWidth={2.6} />
              <Circle cx={32} cy={48} r={16} fill={CRAYON_COLORS.sage} stroke={CRAYON_COLORS.ink} strokeWidth={2.6} />
              <Circle cx={68} cy={48} r={16} fill={CRAYON_COLORS.sage} stroke={CRAYON_COLORS.ink} strokeWidth={2.6} />
            </>
          )}

          {stage === 'fruiting' && (
            <>
              <Circle cx={37} cy={28} r={4} fill={CRAYON_COLORS.blush} stroke={CRAYON_COLORS.ink} strokeWidth={1.3} />
              <Circle cx={61} cy={24} r={4} fill={CRAYON_COLORS.blush} stroke={CRAYON_COLORS.ink} strokeWidth={1.3} />
              <Circle cx={50} cy={50} r={4} fill={CRAYON_COLORS.blush} stroke={CRAYON_COLORS.ink} strokeWidth={1.3} />
              <Circle cx={27} cy={52} r={4} fill={CRAYON_COLORS.blush} stroke={CRAYON_COLORS.ink} strokeWidth={1.3} />
            </>
          )}
        </G>
      </Svg>
    </View>
  );
}
