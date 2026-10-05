// Crayon art-style theme (experimental/beta) — same shape as
// components/theme.ts so a component can switch between the two by just
// picking which theme object it reads. See lib/art-style-context.tsx for
// the toggle that decides which one is active.

export const CRAYON_COLORS = {
  paper: '#FFF6EC',
  ink: '#6B4F3A', // soft brown crayon line — never pure black
  sage: '#A8D69A',
  blush: '#F6B8B8',
  lavender: '#D9C8F0',
  butter: '#FFE9A8',
  sky: '#CDEBF7',
  white: '#FFFFFF',

  background: '#FFF6EC',
  surface: '#FFFFFF',
  surfaceAccent: '#FFF6EC',
  border: '#6B4F3A',
  textPrimary: '#6B4F3A',
  textMuted: '#A3907D',
  error: '#C1554A',
  success: '#5FA06B',
} as const;

// Patrick Hand only ships one weight, so every "heading" alias points at
// it — size and letter-spacing carry the emphasis instead of font-weight.
export const CRAYON_FONTS = {
  heading: 'PatrickHand_400Regular',
  headingSemiBold: 'PatrickHand_400Regular',
  headingMedium: 'PatrickHand_400Regular',
  headingRegular: 'PatrickHand_400Regular',
  serif: 'Literata_400Regular',
  serifMedium: 'Literata_500Medium',
  serifSemiBold: 'Literata_600SemiBold',
  serifItalic: 'Literata_400Regular_Italic',
} as const;

// A soft, blurred smudge instead of the pixel theme's hard offset shadow.
export const CRAYON_SMUDGE_SHADOW = {
  shadowColor: 'rgba(107, 79, 58, 0.3)',
  shadowOffset: { width: 3, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 5,
  elevation: 3,
} as const;
