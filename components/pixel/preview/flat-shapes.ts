// Preview-only helpers for the crisp, flat-color pixel style (hard 1px
// outlines, no soft shading) — used to try out a new sprite direction
// before committing it across the app.
import type { PreviewPaletteKey } from './preview-palette';
import type { PreviewGridData } from './preview-types';

export function createFlatGrid(width: number, height: number) {
  const colorGrid: (PreviewPaletteKey | null)[][] = Array.from({ length: height }, () => Array(width).fill(null));
  const mask: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
  return { width, height, colorGrid, mask };
}

type FlatGrid = ReturnType<typeof createFlatGrid>;

export function stampEllipse(g: FlatGrid, cx: number, cy: number, rx: number, ry: number, color: PreviewPaletteKey) {
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const dx = (x - cx + 0.5) / rx;
      const dy = (y - cy + 0.5) / ry;
      if (dx * dx + dy * dy <= 1) {
        g.mask[y][x] = true;
        g.colorGrid[y][x] = color;
      }
    }
  }
}

export function stampRect(g: FlatGrid, x: number, y: number, w: number, h: number, color: PreviewPaletteKey) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (yy < 0 || yy >= g.height || xx < 0 || xx >= g.width) continue;
      g.mask[yy][xx] = true;
      g.colorGrid[yy][xx] = color;
    }
  }
}

export function finalizeFlatGrid(g: FlatGrid, outlineColor: PreviewPaletteKey = 'outline'): PreviewGridData {
  const grid = g.colorGrid.map((row) => [...row]);
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (g.mask[y][x]) continue;
      const neighbors = [
        [y - 1, x],
        [y + 1, x],
        [y, x - 1],
        [y, x + 1],
      ];
      const touchesShape = neighbors.some(
        ([ny, nx]) => ny >= 0 && ny < g.height && nx >= 0 && nx < g.width && g.mask[ny][nx]
      );
      if (touchesShape) grid[y][x] = outlineColor;
    }
  }
  return grid;
}
