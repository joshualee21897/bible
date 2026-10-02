import { createFlatGrid, finalizeFlatGrid, stampEllipse, stampRect } from './flat-shapes';
import { setPixel } from './iso-shapes';
import type { PreviewGridData } from './preview-types';

const WIDTH = 18;
const HEIGHT = 16;

// A simple, chibi-proportioned lamb: a big round wool body, a smaller head,
// tiny ears, stub black legs — flat color blocks with a crisp outline,
// in the style of the reference animal sprites (no soft shading bands).
export function buildFlatLamb(): PreviewGridData {
  const g = createFlatGrid(WIDTH, HEIGHT);

  stampEllipse(g, 11, 9, 5, 4, 'woolWhite');
  stampEllipse(g, 4, 7, 3, 3, 'woolWhite');

  // Tiny ears.
  stampRect(g, 1, 4, 1, 2, 'woolWhite');
  stampRect(g, 6, 4, 1, 2, 'woolWhite');

  // Stub legs.
  stampRect(g, 7, 12, 1, 2, 'lambLeg');
  stampRect(g, 13, 12, 1, 2, 'lambLeg');
  stampRect(g, 10, 12, 1, 2, 'lambLeg');
  stampRect(g, 15, 12, 1, 2, 'lambLeg');

  const grid = finalizeFlatGrid(g);

  // Face, drawn after the outline so it sits on top of the wool.
  setPixel(grid, 3, 7, 'outline');
  setPixel(grid, 1, 8, 'lambNose');

  return grid;
}
