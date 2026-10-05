import { createFlatGrid, finalizeFlatGrid, stampEllipse } from './flat-shapes';
import type { PaletteKey, PixelGridData } from './types';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'special';

function tierColors(tier: BadgeTier): { ring: PaletteKey; face: PaletteKey } {
  switch (tier) {
    case 'bronze':
      return { ring: 'dirtDark', face: 'dirtLight' };
    case 'silver':
      return { ring: 'stoneDark', face: 'stoneLight' };
    case 'gold':
      return { ring: 'goldDark', face: 'goldLight' };
    case 'special':
      return { ring: 'ravenDark', face: 'lavender' };
  }
}

// A round medal with a small water-drop mark in the middle, since every
// mission pays out in drops. Unearned badges render in a muted grey so
// "locked" reads clearly against "earned."
export function buildBadgeGrid(tier: BadgeTier, achieved: boolean): PixelGridData {
  const { ring, face } = achieved ? tierColors(tier) : { ring: 'stoneDark' as const, face: 'stoneLight' as const };

  const g = createFlatGrid(24, 24);
  stampEllipse(g, 12, 12, 10, 10, ring);
  stampEllipse(g, 12, 12, 7.5, 7.5, face);

  // Water-drop mark: a rounded body with a tapered top.
  stampEllipse(g, 12, 14, 3.4, 3.4, 'waterDark');
  stampEllipse(g, 12, 11.5, 2, 2, 'waterDark');
  stampEllipse(g, 11, 13, 1, 1, 'waterLight');

  return finalizeFlatGrid(g);
}
