import { emptyGrid, paintPolygon, setPixel, strokePolygon, type Point } from './iso-shapes';
import type { PreviewGridData } from './preview-types';

const SIZE = 36;

export function buildIsoGroundTile(): PreviewGridData {
  const grid = emptyGrid(SIZE, SIZE);

  const cx = 18;
  const topY = 6;
  const hw = 15;
  const hh = 7;
  const depth = 9;

  const N: Point = [cx, topY];
  const E: Point = [cx + hw, topY + hh];
  const S: Point = [cx, topY + hh * 2];
  const W: Point = [cx - hw, topY + hh];

  const leftFace: Point[] = [W, S, [S[0], S[1] + depth], [W[0], W[1] + depth]];
  const rightFace: Point[] = [E, S, [S[0], S[1] + depth], [E[0], E[1] + depth]];

  paintPolygon(grid, leftFace, 'dirtDark');
  paintPolygon(grid, rightFace, 'dirtLight');
  paintPolygon(grid, [N, E, S, W], 'grassTop');

  // A soft shaded strip along the back-right of the grass for a touch of depth.
  paintPolygon(grid, [N, E, [E[0] - 3, E[1] + 1], [N[0], N[1] + 2]], 'grassTopShade');

  strokePolygon(grid, leftFace, 'outline');
  strokePolygon(grid, rightFace, 'outline');
  strokePolygon(grid, [N, E, S, W], 'outline');

  // A few small flowers scattered on the grass.
  const flowers: Point[] = [
    [cx - 5, topY + 5],
    [cx + 6, topY + 7],
    [cx - 1, topY + 9],
  ];
  for (const [fx, fy] of flowers) {
    setPixel(grid, fx, fy, 'flowerCenter');
    setPixel(grid, fx - 1, fy, 'flowerPetal');
    setPixel(grid, fx + 1, fy, 'flowerPetal');
    setPixel(grid, fx, fy - 1, 'flowerPetal');
    setPixel(grid, fx, fy + 1, 'flowerPetal');
  }

  // Fence posts ringing the top edge.
  const edges: [Point, Point][] = [
    [N, E],
    [E, S],
    [S, W],
    [W, N],
  ];
  for (const [a, b] of edges) {
    for (const t of [0.3, 0.5, 0.7]) {
      const px = a[0] + (b[0] - a[0]) * t;
      const py = a[1] + (b[1] - a[1]) * t;
      paintFencePost(grid, Math.round(px), Math.round(py));
    }
  }

  return grid;
}

function paintFencePost(grid: PreviewGridData, x: number, y: number) {
  for (let i = 0; i < 5; i++) {
    setPixel(grid, x, y - i, 'fencePost');
  }
  setPixel(grid, x, y - 5, 'outline');
  setPixel(grid, x - 1, y, 'outline');
  setPixel(grid, x + 1, y, 'outline');
}
