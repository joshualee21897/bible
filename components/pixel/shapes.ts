import type { PaletteKey, PixelGridData } from './types';

export function emptyGrid(size: number): PixelGridData {
  return Array.from({ length: size }, () => Array<PaletteKey | null>(size).fill(null));
}

export function paintEllipse(
  grid: PixelGridData,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: PaletteKey,
  shadeBelow?: PaletteKey,
  outline: PaletteKey = 'outline'
) {
  const size = grid.length;
  const outlineBand = 1 / Math.max(rx, ry);
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      if (y < 0 || y >= size || x < 0 || x >= size) continue;
      const dx = (x - cx + 0.5) / rx;
      const dy = (y - cy + 0.5) / ry;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 1) {
        grid[y][x] = shadeBelow && dy > 0.4 ? shadeBelow : fill;
      } else if (dist <= 1 + outlineBand) {
        grid[y][x] = outline;
      }
    }
  }
}

export function paintRect(
  grid: PixelGridData,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fill: PaletteKey,
  outline: PaletteKey | null = 'outline'
) {
  const size = grid.length;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (y < 0 || y >= size || x < 0 || x >= size) continue;
      const isEdge = outline !== null && (x === x0 || x === x1 || y === y0 || y === y1);
      grid[y][x] = isEdge ? outline : fill;
    }
  }
}

export function setPixel(grid: PixelGridData, x: number, y: number, fill: PaletteKey) {
  const size = grid.length;
  if (y < 0 || y >= size || x < 0 || x >= size) return;
  grid[y][x] = fill;
}
