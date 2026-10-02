// A soft pastel garden palette. Outlines stay black (the 8-bit look), but
// every fill color is a gentle pastel instead of a saturated, earthy tone.
export const PALETTE = {
  outline: '#4A3F35',
  woolLight: '#FBF6EF',
  woolShade: '#EBDFD0',

  // The lamb's new flat, crisp-outline look (ported pixel-for-pixel from a
  // reference sprite the user supplied).
  woolCream: '#F1E9DC',
  faceCream: '#F7D9C4',
  cheekLight: '#F6B8B8',
  cheekDark: '#E8A598',
  legTan: '#E6C9B4',
  legHoof: '#C9A88E',
  grassLight: '#7BC96F',
  grassDark: '#5FAE54',
  bark: '#8B5A34',
  barkShade: '#734726',
  leavesLight: '#5FB85B',
  leavesDark: '#469943',
  fruit: '#D1453D',
  waterLight: '#BEE3F5',
  waterDark: '#8FC7E8',
  sky: '#FFF8F0',
  lavender: '#D3C2E8',

  // Extra tones for shop animals and decorations.
  birdLight: '#EAD9C9',
  birdDark: '#C9AE96',
  ravenDark: '#6E6259',
  goldLight: '#F6D9A0',
  goldDark: '#E0B770',
  stoneLight: '#E5DED2',
  stoneDark: '#CBC0AE',

  // Softer, sleepier tones for a resting tree — never a "dead" look, just quieter.
  grassRestingLight: '#D8ECDA',
  grassRestingDark: '#C3DFC7',
  leavesRestingLight: '#D6EAD8',
  leavesRestingDark: '#BFDDC3',
  barkResting: '#E5CFC0',
} as const;

export const AVATAR_COLORS = [
  PALETTE.grassDark,
  PALETTE.bark,
  PALETTE.waterDark,
  PALETTE.fruit,
  PALETTE.lavender,
  PALETTE.goldDark,
] as const;
