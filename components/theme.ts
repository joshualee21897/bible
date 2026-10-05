// Shared UI colors and type styles, matching the "Sprout" garden look
// (warm cream/sage/pink pastels, thick borders, hard offset shadows).

export const COLORS = {
  // Figma-style base palette
  ink: '#4A3F35',
  cream: '#FFF9F0',
  sage: '#A8D69A',
  sageDark: '#7FC28E',
  grass: '#C8E6B5',
  pink: '#F6B8B8',
  lavender: '#D9C8F0',
  yellow: '#FFE9A8',
  water: '#CDEBF7',
  waterDark: '#A8D8EE',
  sky: '#EAF6FB',
  bark: '#D4B08C',
  white: '#FFFFFF',

  // App-wide aliases used across screens
  background: '#FFF9F0',
  gardenBackground: '#EAF6FB',
  surface: '#FFFFFF',
  surfaceAccent: '#FFF9F0',
  primary: '#A8D69A',
  primaryText: '#4A3F35',
  accent: '#F6B8B8',
  accentText: '#4A3F35',
  border: '#4A3F35',
  textPrimary: '#4A3F35',
  textMuted: '#7B7066',
  error: '#C1554A',
  success: '#5FA06B',
} as const;

// Geist Pixel ships only one weight (Regular) — all four heading tokens
// point to it, so screens using any of them stay visually consistent.
export const FONTS = {
  heading: 'GeistPixel_400Regular',
  headingSemiBold: 'GeistPixel_400Regular',
  headingMedium: 'GeistPixel_400Regular',
  headingRegular: 'GeistPixel_400Regular',
  serif: 'Inter_400Regular',
  serifMedium: 'Inter_500Medium',
  serifSemiBold: 'Inter_600SemiBold',
  serifItalic: 'Inter_400Regular_Italic',
} as const;

export const HARD_SHADOW = {
  shadowColor: 'rgba(74, 63, 53, 0.8)',
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
