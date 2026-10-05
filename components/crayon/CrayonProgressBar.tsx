import { useId, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, FeDisplacementMap, FeTurbulence, Filter, Path, Rect } from 'react-native-svg';

import { CRAYON_COLORS } from '../../lib/theme-crayon';
import type { CrayonTone } from './CrayonButton';

const TONE_FILL: Record<CrayonTone, string> = {
  sage: CRAYON_COLORS.sage,
  blush: CRAYON_COLORS.blush,
  butter: CRAYON_COLORS.butter,
  sky: CRAYON_COLORS.sky,
  lavender: CRAYON_COLORS.lavender,
};

type Props = {
  percent: number;
  tone?: CrayonTone;
  height?: number;
};

// A wobbly-bordered track with a crayon-scribble fill (a few hand-drawn
// zigzag strokes over a flat tint) standing in for a pixel progress bar.
export function CrayonProgressBar({ percent, tone = 'sage', height = 16 }: Props) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `crayon-bar-wobble-${rawId}`;
  const [width, setWidth] = useState(0);
  const clamped = Math.max(0, Math.min(100, percent));

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const fillWidth = (width * clamped) / 100;

  // A few horizontal zigzags across the filled area, like a quick crayon
  // scribble filling in a box.
  const scribbleLines: string[] = [];
  const scribbleRows = Math.max(1, Math.floor(height / 5));
  for (let row = 0; row < scribbleRows; row++) {
    const y = 3 + row * (height / scribbleRows);
    let d = `M 4 ${y}`;
    const step = 6;
    let up = true;
    for (let x = 4; x < fillWidth - 4; x += step) {
      d += ` L ${x + step} ${up ? y - 2 : y + 2}`;
      up = !up;
    }
    if (fillWidth > 10) scribbleLines.push(d);
  }

  return (
    <View style={[styles.wrap, { height }]} onLayout={handleLayout}>
      {width > 0 && (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <Filter id={filterId} x="-10%" y="-30%" width="120%" height="160%">
              <FeTurbulence type="fractalNoise" baseFrequency={0.05} numOctaves={1} seed={2} result="noise" />
              <FeDisplacementMap in="SourceGraphic" in2="noise" scale={2.5} />
            </Filter>
          </Defs>
          <Rect
            x={1.5}
            y={1.5}
            width={Math.max(width - 3, 0)}
            height={Math.max(height - 3, 0)}
            rx={height / 2}
            fill={CRAYON_COLORS.paper}
            stroke={CRAYON_COLORS.ink}
            strokeWidth={2}
            filter={`url(#${filterId})`}
          />
          {fillWidth > 4 && (
            <Rect
              x={2}
              y={2}
              width={Math.max(fillWidth - 4, 0)}
              height={Math.max(height - 4, 0)}
              rx={(height - 4) / 2}
              fill={TONE_FILL[tone]}
            />
          )}
          {scribbleLines.map((d, index) => (
            <Path key={index} d={d} stroke={CRAYON_COLORS.ink} strokeWidth={1.2} fill="none" opacity={0.35} />
          ))}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
});
