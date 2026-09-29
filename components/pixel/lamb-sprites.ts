import type { PaletteKey, PixelGridData } from './types';

const SIZE = 24;

export type LambMood = 'happy' | 'waiting' | 'sleeping';

function emptyGrid(): PixelGridData {
  return Array.from({ length: SIZE }, () => Array<PaletteKey | null>(SIZE).fill(null));
}

function paintEllipse(
  grid: PixelGridData,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: PaletteKey,
  shadeBelow?: PaletteKey
) {
  const outlineBand = 1 / Math.max(rx, ry);
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      if (y < 0 || y >= SIZE || x < 0 || x >= SIZE) continue;
      const dx = (x - cx + 0.5) / rx;
      const dy = (y - cy + 0.5) / ry;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 1) {
        grid[y][x] = shadeBelow && dy > 0.4 ? shadeBelow : fill;
      } else if (dist <= 1 + outlineBand) {
        grid[y][x] = 'outline';
      }
    }
  }
}

export function buildLambGrid(mood: LambMood): PixelGridData {
  const grid = emptyGrid();

  // Body, then head in front of it (drawn second so it isn't covered).
  paintEllipse(grid, 14, 16, 7, 5, 'woolLight', 'woolShade');
  paintEllipse(grid, 7, 12, 4, 4, 'woolLight', 'woolShade');

  // Ears.
  grid[8][3] = 'outline';
  grid[8][11] = 'outline';

  // Legs.
  for (const x of [6, 10, 16, 20]) {
    grid[20][x] = 'outline';
    grid[21][x] = 'outline';
  }

  // Face.
  if (mood === 'sleeping') {
    grid[11][5] = 'outline';
    grid[11][9] = 'outline';
    grid[8][14] = 'outline';
    grid[7][16] = 'outline';
  } else if (mood === 'waiting') {
    grid[10][5] = 'outline';
    grid[10][9] = 'outline';
    grid[13][7] = 'outline';
  } else {
    grid[10][5] = 'outline';
    grid[10][9] = 'outline';
  }

  return grid;
}
