// Preview-only palette additions for the new isometric/flat art direction.
// Kept separate from the real palette.ts so nothing in the live app changes
// until this style is approved.
export const PREVIEW_PALETTE = {
  outline: '#000000',
  grassTop: '#7BC96F',
  grassTopShade: '#67B85C',
  dirtLight: '#B98C5C',
  dirtDark: '#9C7349',
  fencePost: '#6B4A2E',
  flowerPetal: '#FFFFFF',
  flowerCenter: '#F6C94C',
  woolWhite: '#FFFFFF',
  woolShade: '#E9E9E9',
  lambLeg: '#1A1A1A',
  lambNose: '#F2A6A6',
  faceTan: '#C89A6E',
  faceTanShade: '#B3835A',

  // Exact match to the reference sheep sprite the user supplied.
  lambOutline: '#4A3F35',
  woolCream: '#F1E9DC',
  faceCream: '#F7D9C4',
  cheekLight: '#F6B8B8',
  cheekDark: '#E8A598',
  legTan: '#E6C9B4',
  legHoof: '#C9A88E',
} as const;

export type PreviewPaletteKey = keyof typeof PREVIEW_PALETTE;
