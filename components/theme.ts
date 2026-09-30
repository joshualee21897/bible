// Shared pastel-garden UI colors and the chunky "pixel button" treatment
// (black border + hard offset shadow, no blur) from the art direction brief.

export const COLORS = {
  background: '#F6F1E4',
  gardenBackground: '#E6F3EA',
  surface: '#FFFBF3',
  surfaceAccent: '#FBEAEF',
  primary: '#B9E4C0',
  primaryText: '#2E4B36',
  accent: '#F3C6D3',
  accentText: '#5C2E3A',
  border: '#000000',
  textPrimary: '#3A332B',
  textMuted: '#8A8074',
  error: '#D9776A',
  success: '#4F8A5F',
} as const;

export const HARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
} as const;

export const buttonBase = {
  borderWidth: 2,
  borderColor: COLORS.border,
  borderRadius: 8,
  ...HARD_SHADOW,
} as const;
