import { createFlatGrid, finalizeFlatGrid, stampEllipse, stampRect } from './flat-shapes';
import type { PaletteKey, PixelGridData } from './types';

export type AnimalKey = 'dove' | 'sparrow' | 'fish' | 'raven' | 'donkey' | 'eagle' | 'lion';

function buildBird(bodyColor: PaletteKey, bellyColor: PaletteKey, beakColor: PaletteKey): PixelGridData {
  const g = createFlatGrid(24, 24);
  stampEllipse(g, 14, 15, 6, 4.5, bodyColor);
  stampEllipse(g, 16, 17.5, 3.2, 2.6, bellyColor);
  stampEllipse(g, 7, 10, 3.2, 3, bodyColor);
  stampRect(g, 3, 9, 2, 2, beakColor);
  const grid = finalizeFlatGrid(g);
  grid[9][6] = 'outline';
  return grid;
}

function buildFish(): PixelGridData {
  // Pond, then the fish composited on top so it keeps its own outline.
  const pondGrid = createFlatGrid(24, 24);
  stampEllipse(pondGrid, 12, 19, 10, 3.5, 'waterLight');
  const grid = finalizeFlatGrid(pondGrid);

  const fishShape = createFlatGrid(24, 24);
  stampEllipse(fishShape, 13, 13, 6, 3.6, 'waterDark');
  stampEllipse(fishShape, 13, 14.3, 5, 1.6, 'waterLight');
  stampEllipse(fishShape, 5.5, 13, 2.2, 2.8, 'waterDark');
  const fishGrid = finalizeFlatGrid(fishShape);

  for (let y = 0; y < fishGrid.length; y++) {
    for (let x = 0; x < fishGrid[0].length; x++) {
      if (fishGrid[y][x]) grid[y][x] = fishGrid[y][x];
    }
  }
  grid[12][17] = 'outline';
  return grid;
}

function buildDonkey(): PixelGridData {
  const g = createFlatGrid(24, 22);
  stampEllipse(g, 14, 11, 7, 5, 'donkeyGray');
  stampEllipse(g, 6, 8, 3.5, 3.5, 'donkeyGray');
  stampEllipse(g, 4, 3, 1.5, 2.5, 'donkeyGrayDark');
  stampEllipse(g, 8, 3, 1.5, 2.5, 'donkeyGrayDark');
  stampRect(g, 8, 15, 1, 5, 'donkeyGrayDark');
  stampRect(g, 12, 15, 1, 5, 'donkeyGrayDark');
  stampRect(g, 17, 15, 1, 5, 'donkeyGrayDark');
  stampRect(g, 20, 15, 1, 5, 'donkeyGrayDark');
  const grid = finalizeFlatGrid(g);
  grid[8][5] = 'outline';
  grid[11][21] = 'outline';
  grid[12][21] = 'outline';
  return grid;
}

function buildEagle(): PixelGridData {
  const g = createFlatGrid(24, 24);
  stampEllipse(g, 14, 15, 6.5, 4.5, 'bark');
  stampEllipse(g, 7, 10, 3.3, 3, 'woolLight');
  stampRect(g, 3, 9, 2, 2, 'goldDark');
  const grid = finalizeFlatGrid(g);
  grid[9][6] = 'outline';
  return grid;
}

function buildLion(): PixelGridData {
  const g = createFlatGrid(24, 22);
  stampEllipse(g, 8, 11, 5.5, 5.5, 'goldDark');
  stampEllipse(g, 4, 8, 3, 3, 'goldDark');
  stampEllipse(g, 12, 8, 3, 3, 'goldDark');
  stampEllipse(g, 4, 14, 3, 3, 'goldDark');
  stampEllipse(g, 12, 14, 3, 3, 'goldDark');
  stampEllipse(g, 16, 14, 6, 4, 'goldLight');
  stampEllipse(g, 8, 11, 3.2, 3, 'goldLight');
  const grid = finalizeFlatGrid(g);
  grid[10][6] = 'outline';
  grid[10][10] = 'outline';
  grid[12][21] = 'outline';
  grid[11][22] = 'goldDark';
  grid[10][22] = 'outline';
  return grid;
}

export function buildAnimalGrid(key: AnimalKey): PixelGridData {
  switch (key) {
    case 'dove':
      return buildBird('woolLight', 'woolCream', 'goldDark');
    case 'sparrow':
      return buildBird('birdDark', 'birdLight', 'goldDark');
    case 'raven':
      return buildBird('ravenDark', 'ravenDark', 'outline');
    case 'fish':
      return buildFish();
    case 'donkey':
      return buildDonkey();
    case 'eagle':
      return buildEagle();
    case 'lion':
      return buildLion();
  }
}
