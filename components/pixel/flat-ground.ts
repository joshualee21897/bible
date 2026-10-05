import { emptyGrid, setPixel } from './iso-shapes';
import type { PixelGridData } from './types';

// A simple flat lawn strip — a checkered grass band with a few daisies —
// for the 2D garden scene. Trees stand on top of it with `showGround`
// turned off, so there's one continuous ground instead of a seam at
// every tree's feet.
export function buildFlatGround(width: number, height = 14): PixelGridData {
  const grid: PixelGridData = emptyGrid(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const band = Math.floor((x + y) / 3) % 2 === 0;
      setPixel(grid, x, y, band ? 'grassLight' : 'grassDark');
    }
  }

  const flowerCount = Math.max(3, Math.round(width / 26));
  for (let i = 0; i < flowerCount; i++) {
    const fx = Math.round(((i + 0.5) / flowerCount) * width);
    const fy = Math.round(height * 0.3);
    setPixel(grid, fx, fy, 'goldDark');
    setPixel(grid, fx - 1, fy, 'woolLight');
    setPixel(grid, fx + 1, fy, 'woolLight');
    setPixel(grid, fx, fy - 1, 'woolLight');
    setPixel(grid, fx, fy + 1, 'woolLight');
  }

  return grid;
}

// A simple fence line — posts with two rails — used to mark off the bought
// animals/items from everyone's trees in the 2D garden scene. Each rail is
// a black-outlined band (not a bare line) and the posts are chunky
// outlined blocks, so it reads as the same thick-outline pixel art as
// every other sprite once scaled up — rendered at a small pixelSize this
// used to come out as thin, smooth-looking lines instead.
export function buildFlatFence(width: number, height = 12): PixelGridData {
  const grid: PixelGridData = emptyGrid(width, height);

  const railBands = [
    { outlineTop: Math.round(height * 0.2), fill: Math.round(height * 0.2) + 1, outlineBottom: Math.round(height * 0.2) + 2 },
    { outlineTop: Math.round(height * 0.65), fill: Math.round(height * 0.65) + 1, outlineBottom: Math.round(height * 0.65) + 2 },
  ];
  for (const band of railBands) {
    for (let x = 0; x < width; x++) {
      setPixel(grid, x, band.outlineTop, 'outline');
      setPixel(grid, x, band.fill, 'bark');
      setPixel(grid, x, band.outlineBottom, 'outline');
    }
  }

  const postSpacing = 28;
  for (let x = 6; x < width; x += postSpacing) {
    for (let y = 0; y < height; y++) {
      const isEdge = y === 0 || y === height - 1;
      setPixel(grid, x - 1, y, 'outline');
      setPixel(grid, x, y, isEdge ? 'outline' : 'barkShade');
      setPixel(grid, x + 1, y, isEdge ? 'outline' : 'barkShade');
      setPixel(grid, x + 2, y, 'outline');
    }
  }

  return grid;
}
