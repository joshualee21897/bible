// Helpers for drawing isometric-looking shapes (a diamond "top" plus
// straight-down "walls") inside a plain pixel grid. The isometric look comes
// entirely from how the points are placed — this still renders through the
// same flat grid-of-squares approach as every other sprite.
import type { PaletteKey, PixelGridData } from './types';

export type Point = [number, number];

export function emptyGrid(width: number, height: number): PixelGridData {
  return Array.from({ length: height }, () => Array<PaletteKey | null>(width).fill(null));
}

function pointInPolygon(x: number, y: number, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function paintPolygon(grid: PixelGridData, poly: Point[], fill: PaletteKey) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const maxX = Math.min(grid[0].length - 1, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(grid.length - 1, Math.ceil(Math.max(...ys)));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInPolygon(x + 0.5, y + 0.5, poly)) grid[y][x] = fill;
    }
  }
}

function drawLine(grid: PixelGridData, x0: number, y0: number, x1: number, y1: number, color: PaletteKey) {
  let cx = Math.round(x0);
  let cy = Math.round(y0);
  const ex = Math.round(x1);
  const ey = Math.round(y1);
  const dx = Math.abs(ex - cx);
  const sx = cx < ex ? 1 : -1;
  const dy = -Math.abs(ey - cy);
  const sy = cy < ey ? 1 : -1;
  let err = dx + dy;
  while (true) {
    if (cy >= 0 && cy < grid.length && cx >= 0 && cx < grid[0].length) grid[cy][cx] = color;
    if (cx === ex && cy === ey) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      cx += sx;
    }
    if (e2 <= dx) {
      err += dx;
      cy += sy;
    }
  }
}

export function strokePolygon(grid: PixelGridData, poly: Point[], color: PaletteKey) {
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    drawLine(grid, x0, y0, x1, y1, color);
  }
}

export function setPixel(grid: PixelGridData, x: number, y: number, color: PaletteKey) {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
    grid[y][x] = color;
  }
}
