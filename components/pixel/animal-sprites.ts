import { emptyGrid, paintEllipse, setPixel } from './shapes';
import type { PixelGridData } from './types';

const SIZE = 24;

export type AnimalKey = 'dove' | 'sparrow' | 'fish' | 'raven' | 'donkey' | 'eagle' | 'lion';

function bird(bodyColor: 'birdLight' | 'birdDark' | 'ravenDark', bellyShade: 'birdDark' | 'ravenDark'): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 13, 15, 6, 4, bodyColor, bellyShade);
  paintEllipse(grid, 7, 10, 3, 3, bodyColor);
  setPixel(grid, 4, 10, 'goldDark');
  setPixel(grid, 7, 9, 'outline');
  return grid;
}

function buildDove(): PixelGridData {
  return bird('birdLight', 'birdDark');
}

function buildSparrow(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 13, 16, 5, 3.5, 'birdDark', 'ravenDark');
  paintEllipse(grid, 8, 12, 2.5, 2.5, 'birdDark');
  setPixel(grid, 5, 12, 'goldDark');
  setPixel(grid, 8, 11, 'outline');
  return grid;
}

function buildRaven(): PixelGridData {
  return bird('ravenDark', 'ravenDark');
}

function buildFish(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 12, 18, 11, 5, 'waterLight');
  paintEllipse(grid, 13, 13, 6, 3.5, 'birdLight', 'waterDark');
  setPixel(grid, 7, 13, 'waterDark');
  setPixel(grid, 6, 12, 'waterDark');
  setPixel(grid, 6, 14, 'waterDark');
  setPixel(grid, 13, 12, 'outline');
  return grid;
}

function buildDonkey(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 14, 15, 7, 4.5, 'birdDark', 'ravenDark');
  paintEllipse(grid, 6, 11, 3.5, 3.5, 'birdDark');
  // Long ears.
  setPixel(grid, 4, 6, 'birdDark');
  setPixel(grid, 4, 7, 'birdDark');
  setPixel(grid, 4, 8, 'outline');
  setPixel(grid, 8, 6, 'birdDark');
  setPixel(grid, 8, 7, 'birdDark');
  setPixel(grid, 8, 8, 'outline');
  setPixel(grid, 5, 11, 'outline');
  // Legs.
  for (const x of [9, 12, 17, 20]) {
    setPixel(grid, x, 19, 'outline');
    setPixel(grid, x, 20, 'outline');
  }
  return grid;
}

function buildEagle(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 13, 15, 6.5, 4.5, 'bark', 'ravenDark');
  paintEllipse(grid, 8, 10, 3, 3, 'woolLight');
  setPixel(grid, 5, 10, 'goldDark');
  setPixel(grid, 8, 9, 'outline');
  return grid;
}

function buildLion(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 14, 16, 6, 4, 'goldLight', 'goldDark');
  paintEllipse(grid, 8, 11, 5, 5, 'goldDark');
  paintEllipse(grid, 8, 11, 3, 3, 'goldLight');
  setPixel(grid, 6, 10, 'outline');
  setPixel(grid, 10, 10, 'outline');
  setPixel(grid, 8, 13, 'outline');
  // Tail with a tuft.
  setPixel(grid, 20, 14, 'goldLight');
  setPixel(grid, 21, 13, 'goldDark');
  return grid;
}

export function buildAnimalGrid(key: AnimalKey): PixelGridData {
  switch (key) {
    case 'dove':
      return buildDove();
    case 'sparrow':
      return buildSparrow();
    case 'fish':
      return buildFish();
    case 'raven':
      return buildRaven();
    case 'donkey':
      return buildDonkey();
    case 'eagle':
      return buildEagle();
    case 'lion':
      return buildLion();
  }
}
