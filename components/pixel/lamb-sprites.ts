import type { PaletteKey, PixelGridData } from './types';

export type LambMood = 'happy' | 'waiting' | 'sleeping' | 'waving' | 'pointing' | 'praying';

// A pixel-exact port of a reference sheep sprite: a side-view walking sheep
// with a pale cream face, pink cheek blush, two-tone wool (white back, cream
// belly), and three visible tan legs with hooves. This is the base pose used
// for "happy", "waiting", and "praying" — moods that only need a caption
// change, not a different stance. "sleeping", "waving", and "pointing" add
// small marks on top of it.
const BASE_GRID: (PaletteKey | null)[][] = [
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, 'outline', 'outline', 'outline', 'outline', null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, 'outline', 'outline', 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'outline', 'outline', 'outline', 'outline', null, null, null, null],
  [null, null, null, null, null, 'outline', 'outline', null, 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'outline', null, null, null],
  [null, null, null, 'outline', 'outline', 'woolLight', 'woolLight', 'outline', 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'outline', null, null, null],
  [null, null, 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'outline', 'outline', null, null],
  [null, 'outline', null, 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'outline', 'woolLight', 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'outline', null],
  ['outline', 'faceCream', 'outline', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'outline', 'faceCream', 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'outline'],
  ['outline', 'faceCream', 'faceCream', 'faceCream', 'outline', 'faceCream', 'faceCream', 'outline', 'faceCream', 'faceCream', 'faceCream', 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolCream', 'woolCream', 'woolCream', 'outline', null],
  [null, 'outline', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolCream', 'woolCream', 'woolCream', 'outline', null],
  [null, null, 'outline', 'cheekLight', 'faceCream', 'cheekDark', 'cheekDark', 'faceCream', 'cheekLight', 'outline', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolLight', 'woolCream', 'woolCream', 'outline', null, null],
  [null, null, null, 'outline', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'outline', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'outline', null],
  [null, null, null, null, 'outline', 'outline', 'outline', 'outline', 'outline', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'outline', null],
  [null, null, null, null, null, null, null, null, 'outline', 'woolCream', 'woolCream', 'woolCream', 'outline', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'outline', 'outline', 'woolCream', 'woolCream', 'outline', null, null],
  [null, null, null, null, null, null, null, null, null, 'outline', 'outline', 'outline', null, 'outline', 'woolCream', 'woolCream', 'outline', 'outline', 'legTan', 'outline', 'outline', null, null, null],
  [null, null, null, null, null, null, null, null, null, 'outline', 'legTan', 'outline', null, null, 'outline', 'outline', 'outline', 'outline', 'legTan', 'outline', null, null, null, null],
  [null, null, null, null, null, null, null, null, null, 'outline', 'legHoof', 'outline', null, null, 'outline', 'legHoof', 'outline', 'outline', 'legHoof', 'outline', null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, 'outline', null, null, null, null, 'outline', null, null, 'outline', null, null, null, null, null],
];

function cloneBase(): PixelGridData {
  return BASE_GRID.map((row) => [...row]);
}

export function buildLambGrid(mood: LambMood): PixelGridData {
  const grid = cloneBase();

  switch (mood) {
    case 'happy':
    case 'waiting':
    case 'praying':
      break;
    case 'sleeping':
      // A small "z" trail above the head.
      grid[1][17] = 'outline';
      grid[2][16] = 'outline';
      grid[2][17] = 'outline';
      grid[3][15] = 'outline';
      grid[3][16] = 'outline';
      break;
    case 'waving':
      // A small raised leg beside the back, in the open space above the wool.
      grid[7][21] = 'outline';
      grid[7][22] = 'outline';
      grid[8][22] = 'outline';
      break;
    case 'pointing':
      // A leg stretched out toward whatever the lamb is pointing at.
      grid[12][23] = 'outline';
      grid[13][22] = 'outline';
      grid[13][23] = 'outline';
      break;
  }

  return grid;
}
