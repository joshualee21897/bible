import { emptyGrid, paintEllipse, paintRect } from './shapes';
import type { PixelGridData } from './types';

const SIZE = 24;

export type DecorationKey = 'well' | 'bench' | 'fence' | 'lanterns';

function buildWell(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 12, 16, 6, 4, 'stoneLight', 'stoneDark');
  paintRect(grid, 3, 6, 5, 12, 'bark');
  paintRect(grid, 19, 6, 21, 12, 'bark');
  paintRect(grid, 3, 4, 21, 6, 'bark');
  return grid;
}

function buildBench(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 3, 12, 21, 15, 'bark');
  paintRect(grid, 4, 18, 6, 20, 'bark');
  paintRect(grid, 18, 18, 20, 20, 'bark');
  return grid;
}

function buildFence(): PixelGridData {
  const grid = emptyGrid(SIZE);
  for (const x of [2, 9, 16]) {
    paintRect(grid, x, 8, x + 2, 20, 'bark');
  }
  paintRect(grid, 1, 10, 22, 12, 'bark');
  paintRect(grid, 1, 15, 22, 17, 'bark');
  return grid;
}

function buildLanterns(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 10, 10, 12, 20, 'bark');
  paintRect(grid, 7, 4, 15, 10, 'goldLight');
  paintRect(grid, 9, 6, 13, 8, 'goldDark', null);
  return grid;
}

export function buildDecorationGrid(key: DecorationKey): PixelGridData {
  switch (key) {
    case 'well':
      return buildWell();
    case 'bench':
      return buildBench();
    case 'fence':
      return buildFence();
    case 'lanterns':
      return buildLanterns();
  }
}
