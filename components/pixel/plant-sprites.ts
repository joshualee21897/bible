import { createFlatGrid, finalizeFlatGrid, stampEllipse, stampRect } from './flat-shapes';
import type { PixelGridData } from './types';

export type PlantKey = 'lilies' | 'fig_tree' | 'palm_tree' | 'cedar' | 'pomegranate_tree' | 'almond_branch';

// A small cluster of lilies, not toiling or spinning (Matthew 6:28).
function buildLilies(): PixelGridData {
  const g = createFlatGrid(24, 20);
  stampEllipse(g, 12, 17, 5, 2.4, 'leavesLight');
  stampEllipse(g, 7, 10, 2.2, 2.2, 'lavender');
  stampEllipse(g, 12, 7, 2.2, 2.2, 'woolLight');
  stampEllipse(g, 17, 10, 2.2, 2.2, 'lavender');
  const grid = finalizeFlatGrid(g);
  grid[10][7] = 'goldDark';
  grid[7][12] = 'goldDark';
  grid[10][17] = 'goldDark';
  return grid;
}

// A small fig tree, everyone under their own vine and fig tree (Micah 4:4).
// Figs are a dusky purple-brown, not red, so it reads differently from the
// pomegranate tree at a glance.
function buildFigTree(): PixelGridData {
  const g = createFlatGrid(24, 24);
  stampRect(g, 11, 14, 2, 8, 'bark');
  stampEllipse(g, 12, 9, 8, 6, 'leavesDark');
  stampEllipse(g, 12, 7, 6, 4.5, 'leavesLight');
  const grid = finalizeFlatGrid(g);
  grid[10][7] = 'maneBrown';
  grid[8][15] = 'maneBrown';
  grid[12][11] = 'maneBrown';
  return grid;
}

// A tall palm, flourishing like a palm tree (Psalm 92:12).
function buildPalmTree(): PixelGridData {
  const g = createFlatGrid(20, 28);
  stampRect(g, 9, 10, 2, 16, 'bark');
  stampEllipse(g, 10, 7, 7, 3, 'leavesDark');
  stampEllipse(g, 4, 5, 3, 1.6, 'leavesLight');
  stampEllipse(g, 16, 5, 3, 1.6, 'leavesLight');
  const grid = finalizeFlatGrid(g);
  grid[8][6] = 'fruit';
  return grid;
}

// A tall, tiered evergreen, growing like a cedar in Lebanon (Psalm 92:12).
function buildCedar(): PixelGridData {
  const g = createFlatGrid(22, 28);
  stampRect(g, 10, 20, 2, 6, 'bark');
  stampEllipse(g, 11, 16, 7, 4, 'leavesDark');
  stampEllipse(g, 11, 11, 5.5, 3.6, 'leavesDark');
  stampEllipse(g, 11, 7, 4, 3, 'leavesLight');
  return finalizeFlatGrid(g);
}

// A small tree with round, deep red fruit (Exodus 28:33).
function buildPomegranateTree(): PixelGridData {
  const g = createFlatGrid(24, 24);
  stampRect(g, 11, 14, 2, 8, 'bark');
  stampEllipse(g, 12, 9, 7, 5.5, 'leavesLight');
  const grid = finalizeFlatGrid(g);
  grid[8][7] = 'fruit';
  grid[7][7] = 'fruit';
  grid[10][16] = 'fruit';
  grid[9][16] = 'fruit';
  grid[6][12] = 'fruit';
  return grid;
}

// A bare branch with a few pink-white blossoms — Aaron's rod that budded
// (Numbers 17:8).
function buildAlmondBranch(): PixelGridData {
  const g = createFlatGrid(24, 16);
  stampRect(g, 2, 8, 18, 2, 'bark');
  stampRect(g, 6, 5, 1, 4, 'barkShade');
  stampRect(g, 12, 4, 1, 5, 'barkShade');
  stampRect(g, 17, 6, 1, 3, 'barkShade');
  const grid = finalizeFlatGrid(g);
  grid[4][6] = 'cheekLight';
  grid[3][12] = 'cheekLight';
  grid[5][17] = 'cheekLight';
  grid[4][13] = 'woolLight';
  return grid;
}

export function buildPlantGrid(key: PlantKey): PixelGridData {
  switch (key) {
    case 'lilies':
      return buildLilies();
    case 'fig_tree':
      return buildFigTree();
    case 'palm_tree':
      return buildPalmTree();
    case 'cedar':
      return buildCedar();
    case 'pomegranate_tree':
      return buildPomegranateTree();
    case 'almond_branch':
      return buildAlmondBranch();
  }
}
