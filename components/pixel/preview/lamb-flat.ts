import { createFlatGrid, finalizeFlatGrid, stampEllipse, stampRect } from './flat-shapes';
import { setPixel } from './iso-shapes';
import type { PreviewGridData } from './preview-types';

const WIDTH = 22;
const HEIGHT = 18;

function paintWoolAndFace(g: ReturnType<typeof createFlatGrid>) {
  // Wool: a tight cluster of overlapping circles gives a scalloped, cloud-like
  // edge without the body ballooning out of proportion with the face.
  stampEllipse(g, 13, 10, 4.5, 4, 'woolWhite');
  stampEllipse(g, 9, 7, 2.8, 2.8, 'woolWhite');
  stampEllipse(g, 13, 5.5, 2.8, 2.8, 'woolWhite');
  stampEllipse(g, 17, 7, 2.8, 2.8, 'woolWhite');
  stampEllipse(g, 9, 13, 2.8, 2.8, 'woolWhite');
  stampEllipse(g, 13, 14.5, 2.8, 2.8, 'woolWhite');
  stampEllipse(g, 17, 13, 2.8, 2.8, 'woolWhite');

  // Ears, stamped before the face so the face sits on top at the seam.
  stampEllipse(g, 3, 5, 1.7, 2, 'faceTanShade');
  stampEllipse(g, 7, 5, 1.7, 2, 'faceTanShade');

  // Face, drawn last so it reads as a clear, separate patch up front.
  stampEllipse(g, 5, 9, 3, 2.8, 'faceTan');
}

function addFeatures(grid: PreviewGridData) {
  setPixel(grid, 4, 9, 'outline');
  setPixel(grid, 2, 10, 'lambNose');
}

// A resting lamb, tucked down with no legs showing — for the garden scene.
export function buildFlatLamb(): PreviewGridData {
  const g = createFlatGrid(WIDTH, HEIGHT);
  paintWoolAndFace(g);
  const grid = finalizeFlatGrid(g);
  addFeatures(grid);
  return grid;
}

// Standing pose (same wool/face/ear shapes, plus legs) — for screens where
// the lamb needs to be up and about rather than resting.
export function buildFlatLambStanding(): PreviewGridData {
  const g = createFlatGrid(WIDTH, HEIGHT + 4);
  paintWoolAndFace(g);
  stampRect(g, 10, 17, 1, 3, 'lambLeg');
  stampRect(g, 16, 17, 1, 3, 'lambLeg');
  const grid = finalizeFlatGrid(g);
  addFeatures(grid);
  return grid;
}
