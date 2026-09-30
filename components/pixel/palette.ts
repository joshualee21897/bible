// A soft pastel garden palette. Outlines stay black (the 8-bit look), but
// every fill color is a gentle pastel instead of a saturated, earthy tone.
export const PALETTE = {
  outline: '#000000',
  woolLight: '#FBF6EF',
  woolShade: '#EBDFD0',
  grassLight: '#B9E4C0',
  grassDark: '#8FCC9D',
  bark: '#D8A98B',
  leavesLight: '#BFE8C4',
  leavesDark: '#93CE9E',
  fruit: '#F3A6A6',
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
