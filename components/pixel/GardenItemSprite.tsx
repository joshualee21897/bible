import { useMemo } from 'react';

import { buildAnimalGrid, type AnimalKey } from './animal-sprites';
import { buildDecorationGrid, type DecorationKey } from './item-sprites';
import { PixelGrid } from './PixelGrid';

const ANIMAL_KEYS = new Set<AnimalKey>(['dove', 'sparrow', 'fish', 'raven', 'donkey', 'eagle', 'lion']);

type Props = {
  itemKey: string;
  pixelSize?: number;
};

export function GardenItemSprite({ itemKey, pixelSize = 4 }: Props) {
  const grid = useMemo(() => {
    if (ANIMAL_KEYS.has(itemKey as AnimalKey)) {
      return buildAnimalGrid(itemKey as AnimalKey);
    }
    return buildDecorationGrid(itemKey as DecorationKey);
  }, [itemKey]);

  return <PixelGrid grid={grid} pixelSize={pixelSize} />;
}
