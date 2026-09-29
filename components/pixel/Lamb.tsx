import { useMemo } from 'react';

import { PixelGrid } from './PixelGrid';
import { buildLambGrid, type LambMood } from './lamb-sprites';

type Props = {
  mood?: LambMood;
  pixelSize?: number;
};

export function Lamb({ mood = 'happy', pixelSize = 4 }: Props) {
  const grid = useMemo(() => buildLambGrid(mood), [mood]);
  return <PixelGrid grid={grid} pixelSize={pixelSize} />;
}
