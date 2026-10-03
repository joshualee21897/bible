import type { TreeStage } from '../../lib/tree';
import { createFlatGrid, finalizeFlatGrid, stampEllipse, stampRect } from './flat-shapes';
import type { PaletteKey, PixelGridData } from './types';

const SIZE = 32;
const GROUND_Y = SIZE - 2;

function paintGround(grid: PixelGridData, resting: boolean) {
  const light = resting ? 'grassRestingLight' : 'grassLight';
  const dark = resting ? 'grassRestingDark' : 'grassDark';
  for (let x = 0; x < SIZE; x++) {
    grid[SIZE - 1][x] = x % 2 === 0 ? light : dark;
    grid[SIZE - 2][x] = light;
  }
}

export function buildTreeGrid(stage: TreeStage, resting = false, showGround = true): PixelGridData {
  const g = createFlatGrid(SIZE, SIZE);
  const cx = SIZE / 2;
  const bark = resting ? 'barkResting' : 'bark';
  const barkShade: PaletteKey = resting ? 'barkResting' : 'barkShade';
  const leavesLight = resting ? 'leavesRestingLight' : 'leavesLight';
  const leavesDark = resting ? 'leavesRestingDark' : 'leavesDark';

  if (stage === 'seed') {
    stampEllipse(g, cx, GROUND_Y - 1, 2.2, 1.6, bark);
  } else if (stage === 'sprout') {
    stampRect(g, cx - 0.5, GROUND_Y - 4, 1, 4, bark);
    stampEllipse(g, cx, GROUND_Y - 6, 2.2, 2.2, leavesLight);
  } else if (stage === 'sapling') {
    stampRect(g, cx - 1, GROUND_Y - 9, 2, 9, bark);
    stampRect(g, cx - 1, GROUND_Y - 9, 2, 3, barkShade);
    stampEllipse(g, cx, GROUND_Y - 11, 3.6, 3.2, leavesLight);
    stampEllipse(g, cx - 2.5, GROUND_Y - 9, 2.4, 2.2, leavesLight);
    stampEllipse(g, cx + 2.5, GROUND_Y - 9, 2.4, 2.2, leavesDark);
  } else {
    stampRect(g, cx - 1.5, GROUND_Y - 13, 3, 13, bark);
    stampRect(g, cx - 1.5, GROUND_Y - 13, 3, 4, barkShade);
    stampEllipse(g, cx, GROUND_Y - 18, 6.5, 5.5, leavesLight);
    stampEllipse(g, cx - 5, GROUND_Y - 16, 4, 3.6, leavesLight);
    stampEllipse(g, cx + 5, GROUND_Y - 16, 4, 3.6, leavesDark);
    stampEllipse(g, cx - 3, GROUND_Y - 21, 3.6, 3.2, leavesLight);
    stampEllipse(g, cx + 3, GROUND_Y - 21, 3.6, 3.2, leavesLight);
    stampEllipse(g, cx, GROUND_Y - 13, 4.5, 3.5, leavesDark);
  }

  const grid = finalizeFlatGrid(g);
  if (showGround) paintGround(grid, resting);

  if (stage === 'fruiting') {
    const fruitSpots: [number, number][] = [
      [cx - 4, GROUND_Y - 19],
      [cx + 3, GROUND_Y - 15],
      [cx - 1, GROUND_Y - 22],
      [cx + 6, GROUND_Y - 19],
      [cx - 6, GROUND_Y - 15],
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
