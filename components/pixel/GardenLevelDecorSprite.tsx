import { useMemo } from 'react';

import { buildLevelDecorGrid, type GardenLevelDecorKey } from './garden-level-decor';
import { PixelGrid } from './PixelGrid';

type Props = {
  decorKey: GardenLevelDecorKey;
  pixelSize?: number;
};

export function GardenLevelDecorSprite({ decorKey, pixelSize = 4 }: Props) {
  const grid = useMemo(() => buildLevelDecorGrid(decorKey), [decorKey]);
  return <PixelGrid grid={grid} pixelSize={pixelSize} />;
}
