export const PALETTE = {
  outline: '#000000',
  woolLight: '#F7F3E8',
  woolShade: '#D9D2C0',
  grassLight: '#6DAA45',
  grassDark: '#4E8A32',
  bark: '#7A4E2D',
  leavesLight: '#77C063',
  leavesDark: '#3F8F4A',
  fruit: '#C8403A',
  waterLight: '#8EC5F0',
  waterDark: '#5B9BD5',
  sky: '#FFFFFF',

  // Extra tones for shop animals and decorations, kept in the same
  // muted, earthy family as the base palette above.
  birdLight: '#C9C2B4',
  birdDark: '#8B8272',
  ravenDark: '#3A3530',
  goldLight: '#E3B96A',
  goldDark: '#B9832E',
  stoneLight: '#C9C4B8',
  stoneDark: '#9B968A',

  // Softer, sleepier tones for a resting tree — never a "dead" look, just quieter.
  grassRestingLight: '#A9C79A',
  grassRestingDark: '#8FAE80',
  leavesRestingLight: '#A9CBAE',
  leavesRestingDark: '#82AE8A',
  barkResting: '#A38868',
} as const;

export const AVATAR_COLORS = [
  PALETTE.grassDark,
  PALETTE.bark,
  PALETTE.leavesDark,
  PALETTE.fruit,
  PALETTE.waterDark,
  '#B98A2E',
] as const;
