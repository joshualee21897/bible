import { useId, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, FeDisplacementMap, FeTurbulence, Filter, Rect } from 'react-native-svg';

import { CRAYON_COLORS, CRAYON_SMUDGE_SHADOW } from '../../lib/theme-crayon';

type Props = {
  children: ReactNode;
  fill?: string;
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

// A card with a hand-drawn wobbly border instead of a straight one — the
// rect itself is normal, but an SVG displacement filter nudges its edges
// around using fractal noise, so no two renders (or two cards) look quite
// machine-perfect.
export function CrayonCard({ children, fill = CRAYON_COLORS.white, padding = 14, style }: Props) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `crayon-wobble-${rawId}`;
  const [size, setSize] = useState({ width: 0, height: 0 });

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }

  return (
    <View style={[styles.wrap, CRAYON_SMUDGE_SHADOW, style]} onLayout={handleLayout}>
      {size.width > 0 && size.height > 0 && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <FeTurbulence type="fractalNoise" baseFrequency={0.012} numOctaves={2} seed={4} result="noise" />
              <FeDisplacementMap in="SourceGraphic" in2="noise" scale={5} />
            </Filter>
          </Defs>
          <Rect
            x={3}
            y={3}
            width={Math.max(size.width - 6, 0)}
            height={Math.max(size.height - 6, 0)}
            rx={16}
            fill={fill}
            stroke={CRAYON_COLORS.ink}
            strokeWidth={2.5}
            filter={`url(#${filterId})`}
          />
        </Svg>
      )}
      <View style={[styles.content, { padding }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  content: {
    position: 'relative',
  },
});
