import { emptyGrid, paintEllipse, paintRect, setPixel } from './shapes';
import type { PixelGridData } from './types';

const SIZE = 24;

// One small icon per garden level (levels 1–6; level 0, Good Ground, has no
// icon of its own — it's the plain starting grass). They build up
// additively: at level 3 the garden shows the level-1, 2, and 3 icons
// together, never just the newest one.
export type GardenLevelDecorKey = 'tent' | 'sheepfold' | 'olive_grove' | 'vineyard' | 'house' | 'eden_river';

const DECOR_BY_LEVEL_INDEX: Record<number, GardenLevelDecorKey> = {
  1: 'tent',
  2: 'sheepfold',
  3: 'olive_grove',
  4: 'vineyard',
  5: 'house',
  6: 'eden_river',
};

// Every decor icon unlocked so far, for a garden currently at this level.
export function getLevelDecorKeys(levelIndex: number): GardenLevelDecorKey[] {
  const keys: GardenLevelDecorKey[] = [];
  for (let i = 1; i <= levelIndex; i++) {
    const key = DECOR_BY_LEVEL_INDEX[i];
    if (key) keys.push(key);
  }
  return keys;
}

function buildTent(): PixelGridData {
  const grid = emptyGrid(SIZE);
  for (let y = 6; y <= 20; y++) {
    const t = (y - 6) / 14;
    const halfWidth = Math.round(t * 8);
    const x0 = 12 - halfWidth;
    const x1 = 12 + halfWidth;
    for (let x = x0; x <= x1; x++) {
      const isEdge = x === x0 || x === x1 || y === 20;
      setPixel(grid, x, y, isEdge ? 'outline' : 'woolCream');
    }
  }
  paintRect(grid, 10, 14, 14, 20, 'barkShade', null);
  return grid;
}

function buildSheepfold(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 2, 10, 21, 20, 'stoneLight');
  paintRect(grid, 2, 18, 21, 20, 'stoneDark', null);
  paintRect(grid, 9, 15, 10, 20, 'bark', null);
  paintRect(grid, 13, 15, 14, 20, 'bark', null);
  paintEllipse(grid, 12, 15, 3, 2, 'woolLight', 'woolShade');
  setPixel(grid, 10, 15, 'faceCream');
  return grid;
}

function buildOliveGrove(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 2, 14, 4, 20, 'bark', null);
  paintEllipse(grid, 3, 10, 4, 4, 'leavesDark', 'leavesLight');
  paintRect(grid, 19, 14, 21, 20, 'bark', null);
  paintEllipse(grid, 20, 10, 4, 4, 'leavesDark', 'leavesLight');
  paintEllipse(grid, 12, 18, 4, 2, 'stoneLight', 'stoneDark');
  paintRect(grid, 9, 10, 10, 18, 'bark', null);
  paintRect(grid, 14, 10, 15, 18, 'bark', null);
  return grid;
}

function buildVineyard(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 2, 4, 4, 18, 'bark', null);
  paintRect(grid, 19, 4, 21, 18, 'bark', null);
  paintRect(grid, 2, 4, 21, 6, 'bark', null);
  paintEllipse(grid, 7, 10, 2, 2, 'fruit', 'leavesDark');
  paintEllipse(grid, 12, 12, 2, 2, 'fruit', 'leavesDark');
  paintEllipse(grid, 17, 10, 2, 2, 'fruit', 'leavesDark');
  paintEllipse(grid, 12, 20, 6, 2, 'stoneDark', 'stoneLight');
  return grid;
}

function buildHouse(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 2, 19, 21, 22, 'stoneDark');
  paintRect(grid, 5, 10, 18, 19, 'stoneLight');
  for (let y = 4; y <= 10; y++) {
    const t = (y - 4) / 6;
    const halfWidth = Math.round(t * 9);
    paintRect(grid, 12 - halfWidth, y, 12 + halfWidth, y, 'bark', null);
  }
  paintRect(grid, 10, 14, 13, 19, 'barkShade', null);
  return grid;
}

function buildEdenRiver(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 0, 16, 23, 20, 'waterLight', null);
  paintRect(grid, 0, 18, 23, 19, 'waterDark', null);
  setPixel(grid, 4, 6, 'cheekLight');
  setPixel(grid, 8, 4, 'cheekDark');
  setPixel(grid, 16, 5, 'cheekLight');
  setPixel(grid, 20, 7, 'cheekDark');
  paintEllipse(grid, 12, 8, 3, 2, 'birdLight', 'birdDark');
  return grid;
}

export function buildLevelDecorGrid(key: GardenLevelDecorKey): PixelGridData {
  switch (key) {
    case 'tent':
      return buildTent();
    case 'sheepfold':
      return buildSheepfold();
    case 'olive_grove':
      return buildOliveGrove();
    case 'vineyard':
      return buildVineyard();
    case 'house':
      return buildHouse();
    case 'eden_river':
      return buildEdenRiver();
  }
}
