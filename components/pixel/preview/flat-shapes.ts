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

// Overlapping circles can leave tiny gaps where a pixel sits in the "armpit"
// between two bumps but isn't covered by either — surrounded by filled
// pixels on most sides, it would otherwise get mistaken for an outline
// pixel and show up as a stray black speck. Promote those into the shape
// first so the silhouette comes out clean.
function fillInteriorGaps(g: FlatGrid) {
  for (let pass = 0; pass < 2; pass++) {
    const toFill: { y: number; x: number; color: PreviewPaletteKey }[] = [];
    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        if (g.mask[y][x]) continue;
        const neighbors = [
          [y - 1, x],
          [y + 1, x],
          [y, x - 1],
          [y, x + 1],
        ];
        let count = 0;
        let fillColor: PreviewPaletteKey | null = null;
        for (const [ny, nx] of neighbors) {
          if (ny >= 0 && ny < g.height && nx >= 0 && nx < g.width && g.mask[ny][nx]) {
            count++;
            if (!fillColor) fillColor = g.colorGrid[ny][nx];
          }
        }
        if (count >= 3 && fillColor) toFill.push({ y, x, color: fillColor });
      }
    }
    for (const { y, x, color } of toFill) {
      g.mask[y][x] = true;
      g.colorGrid[y][x] = color;
    }
  }
}

export function finalizeFlatGrid(g: FlatGrid, outlineColor: PreviewPaletteKey = 'outline'): PreviewGridData {
  fillInteriorGaps(g);
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
