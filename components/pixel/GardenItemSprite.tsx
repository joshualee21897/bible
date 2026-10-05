import { useMemo } from 'react';

import { buildAnimalGrid, type AnimalKey } from './animal-sprites';
import { buildDecorationGrid, type DecorationKey } from './item-sprites';
import { PixelGrid } from './PixelGrid';
import { buildPlantGrid, type PlantKey } from './plant-sprites';

const ANIMAL_KEYS = new Set<AnimalKey>([
  'dove',
  'sparrow',
  'fish',
  'raven',
  'donkey',
  'eagle',
  'lion',
  'deer',
  'ram',
  'hen_and_chicks',
  'camel',
  'ox',
  'ant_hill',
  'beehive',
]);

const PLANT_KEYS = new Set<PlantKey>(['lilies', 'fig_tree', 'palm_tree', 'cedar', 'pomegranate_tree', 'almond_branch']);

type Props = {
  itemKey: string;
  pixelSize?: number;
};

export function GardenItemSprite({ itemKey, pixelSize = 4 }: Props) {
  const grid = useMemo(() => {
    if (ANIMAL_KEYS.has(itemKey as AnimalKey)) {
      return buildAnimalGrid(itemKey as AnimalKey);
    }
    if (PLANT_KEYS.has(itemKey as PlantKey)) {
      return buildPlantGrid(itemKey as PlantKey);
    }
    return buildDecorationGrid(itemKey as DecorationKey);
  }, [itemKey]);

  return <PixelGrid grid={grid} pixelSize={pixelSize} />;
}
