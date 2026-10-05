import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, FeDisplacementMap, FeTurbulence, Filter, G, Rect } from 'react-native-svg';

import { CRAYON_COLORS } from '../../lib/theme-crayon';

type Props = { size?: number };

// A simple, cute, hand-drawn lamb — a round cream wool body, peach face,
// rosy cheeks, and small dark legs. A placeholder for real illustrated
// art later; swap this file out when that's ready.
export function Lamb({ size = 72 }: Props) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `crayon-lamb-${rawId}`;
  const height = size * 0.8;

  return (
    <View style={{ width: size, height }}>
      <Svg width={size} height={height} viewBox="0 0 100 80">
        <Defs>
          <Filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <FeTurbulence type="fractalNoise" baseFrequency={0.02} numOctaves={2} seed={11} result="noise" />
            <FeDisplacementMap in="SourceGraphic" in2="noise" scale={3} />
          </Filter>
        </Defs>
        <G filter={`url(#${filterId})`}>
          <Rect x={32} y={58} width={7} height={16} rx={3} fill={CRAYON_COLORS.ink} />
          <Rect x={62} y={58} width={7} height={16} rx={3} fill={CRAYON_COLORS.ink} />
          <Ellipse cx={56} cy={46} rx={33} ry={22} fill="#FBF6EF" stroke={CRAYON_COLORS.ink} strokeWidth={2.6} />
          <Circle cx={24} cy={40} r={16} fill="#F7D9C4" stroke={CRAYON_COLORS.ink} strokeWidth={2.6} />
          <Circle cx={17} cy={46} r={4} fill={CRAYON_COLORS.blush} opacity={0.85} />
          <Circle cx={30} cy={46} r={4} fill={CRAYON_COLORS.blush} opacity={0.85} />
          <Circle cx={18} cy={36} r={1.8} fill={CRAYON_COLORS.ink} />
          <Circle cx={30} cy={36} r={1.8} fill={CRAYON_COLORS.ink} />
        </G>
      </Svg>
    </View>
  );
}
