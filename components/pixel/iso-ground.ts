import { emptyGrid, paintPolygon, setPixel, strokePolygon, type Point } from './iso-shapes';
import type { PixelGridData } from './types';

const HH = 16;
const DEPTH = 22;
const TOP_Y = 14;
const BASE_HW = 14;
// A standing tree sprite is 32 grid-cells wide, so slots need to be spaced
// at least that far apart (plus a small gap) to avoid trees overlapping.
const PER_SLOT_HW = 36;
const MARGIN = 10;

export type IsoGroundLayout = {
  width: number;
  height: number;
  hw: number;
  hh: number;
  /** Grid-cell x for a slot's bottom-center anchor, given its index among `total` slots. */
  slotX: (index: number, total: number) => number;
  /** Grid-cell y for every slot's anchor (the grass band's baseline). */
  slotY: number;
};

function paintFencePost(grid: PixelGridData, x: number, y: number) {
  for (let i = 0; i < 5; i++) {
    setPixel(grid, x, y - i, 'bark');
    setPixel(grid, x + 1, y - i, 'bark');
  }
  setPixel(grid, x - 1, y - 5, 'outline');
  setPixel(grid, x, y - 5, 'outline');
  setPixel(grid, x + 1, y - 5, 'outline');
  setPixel(grid, x + 2, y - 5, 'outline');
  setPixel(grid, x - 1, y, 'outline');
  setPixel(grid, x + 2, y, 'outline');
}

// Builds a wide isometric "garden plot" — a grass diamond with dirt sides
// and a fence ring — sized to fit `totalSlots` trees/characters side by side.
export function buildIsoGround(totalSlots: number): { grid: PixelGridData; layout: IsoGroundLayout } {
  const hw = BASE_HW + Math.max(0, totalSlots - 1) * PER_SLOT_HW;
  const cx = hw + MARGIN;
  const width = cx + hw + MARGIN;
  const height = TOP_Y + HH * 2 + DEPTH + MARGIN;

  const grid = emptyGrid(width, height);

  const N: Point = [cx, TOP_Y];
  const E: Point = [cx + hw, TOP_Y + HH];
  const S: Point = [cx, TOP_Y + HH * 2];
  const W: Point = [cx - hw, TOP_Y + HH];

  const leftFace: Point[] = [W, S, [S[0], S[1] + DEPTH], [W[0], W[1] + DEPTH]];
  const rightFace: Point[] = [E, S, [S[0], S[1] + DEPTH], [E[0], E[1] + DEPTH]];

  paintPolygon(grid, leftFace, 'dirtDark');
  paintPolygon(grid, rightFace, 'dirtLight');
  paintPolygon(grid, [N, E, S, W], 'grassLight');
  paintPolygon(grid, [N, E, [E[0] - hw * 0.25, E[1] + 2], [N[0], N[1] + 3]], 'grassDark');

  strokePolygon(grid, leftFace, 'outline');
  strokePolygon(grid, rightFace, 'outline');
  strokePolygon(grid, [N, E, S, W], 'outline');

  const flowerCount = Math.max(2, Math.round(hw / 22));
  for (let i = 0; i < flowerCount; i++) {
    const t = (i + 1) / (flowerCount + 1);
    const fx = Math.round(W[0] + (E[0] - W[0]) * t);
    const fy = Math.round(TOP_Y + HH + (i % 2 === 0 ? -3 : 3));
    setPixel(grid, fx, fy, 'goldDark');
    setPixel(grid, fx - 1, fy, 'woolLight');
    setPixel(grid, fx + 1, fy, 'woolLight');
    setPixel(grid, fx, fy - 1, 'woolLight');
    setPixel(grid, fx, fy + 1, 'woolLight');
  }

  const edges: [Point, Point][] = [
    [N, E],
    [E, S],
    [S, W],
    [W, N],
  ];
  for (const [a, b] of edges) {
    const edgeLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const postCount = Math.max(2, Math.round(edgeLen / 16));
    for (let i = 1; i < postCount; i++) {
      const t = i / postCount;
      const px = a[0] + (b[0] - a[0]) * t;
      const py = a[1] + (b[1] - a[1]) * t;
      paintFencePost(grid, Math.round(px), Math.round(py));
    }
  }

  const layout: IsoGroundLayout = {
    width,
    height,
    hw,
    hh: HH,
    slotX: (index, total) => {
      const innerLeft = cx - hw + MARGIN + 6;
      const innerRight = cx + hw - MARGIN - 6;
      if (total <= 1) return (innerLeft + innerRight) / 2;
      return innerLeft + ((innerRight - innerLeft) * index) / (total - 1);
    },
    slotY: TOP_Y + HH,
  };

  return { grid, layout };
}
