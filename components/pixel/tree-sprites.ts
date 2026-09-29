import type { TreeStage } from '../../lib/tree';
import type { PaletteKey, PixelGridData } from './types';

const SIZE = 32;
const GROUND_Y = SIZE - 2;

function emptyGrid(): PixelGridData {
  return Array.from({ length: SIZE }, () => Array<PaletteKey | null>(SIZE).fill(null));
}

function paintGround(grid: PixelGridData, resting: boolean) {
  const light = resting ? 'grassRestingLight' : 'grassLight';
  const dark = resting ? 'grassRestingDark' : 'grassDark';
  for (let x = 0; x < SIZE; x++) {
    grid[SIZE - 1][x] = x % 2 === 0 ? light : dark;
    grid[SIZE - 2][x] = light;
  }
}

function paintCircle(
  grid: PixelGridData,
  cx: number,
  cy: number,
  r: number,
  fill: PaletteKey,
  shadeLeft?: PaletteKey
) {
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      if (y < 0 || y >= SIZE || x < 0 || x >= SIZE) continue;
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= r) {
        grid[y][x] = shadeLeft && dx < 0 ? shadeLeft : fill;
      } else if (dist <= r + 1) {
        grid[y][x] = 'outline';
      }
    }
  }
}

function paintTrunk(grid: PixelGridData, cx: number, top: number, bottom: number, halfWidth: number, fill: PaletteKey) {
  for (let y = top; y <= bottom; y++) {
    for (let x = cx - halfWidth; x <= cx + halfWidth; x++) {
      if (y < 0 || y >= SIZE || x < 0 || x >= SIZE) continue;
      const isEdge = x === cx - halfWidth || x === cx + halfWidth;
      grid[y][x] = isEdge ? 'outline' : fill;
    }
  }
}

export function buildTreeGrid(stage: TreeStage, resting = false): PixelGridData {
  const grid = emptyGrid();
  paintGround(grid, resting);
  const cx = SIZE / 2;
  const bark = resting ? 'barkResting' : 'bark';
  const leavesLight = resting ? 'leavesRestingLight' : 'leavesLight';
  const leavesDark = resting ? 'leavesRestingDark' : 'leavesDark';

  if (stage === 'seed') {
    paintCircle(grid, cx, GROUND_Y - 1, 2, bark);
    return grid;
  }

  if (stage === 'sprout') {
    paintTrunk(grid, cx, GROUND_Y - 4, GROUND_Y, 0, bark);
    paintCircle(grid, cx, GROUND_Y - 5, 2, leavesLight);
    return grid;
  }

  if (stage === 'sapling') {
    paintTrunk(grid, cx, GROUND_Y - 8, GROUND_Y, 1, bark);
    paintCircle(grid, cx, GROUND_Y - 10, 5, leavesLight, leavesDark);
    return grid;
  }

  paintTrunk(grid, cx, GROUND_Y - 12, GROUND_Y, 2, bark);
  paintCircle(grid, cx, GROUND_Y - 17, 8, leavesLight, leavesDark);

  if (stage === 'fruiting') {
    const fruitSpots: [number, number][] = [
      [cx - 4, GROUND_Y - 19],
      [cx + 3, GROUND_Y - 15],
      [cx - 1, GROUND_Y - 21],
      [cx + 5, GROUND_Y - 20],
    ];
    for (const [x, y] of fruitSpots) {
      const xi = Math.round(x);
      const yi = Math.round(y);
      if (yi >= 0 && yi < SIZE && xi >= 0 && xi < SIZE) {
        grid[yi][xi] = 'fruit';
      }
    }
  }

  return grid;
}
