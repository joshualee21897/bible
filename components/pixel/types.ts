import { PALETTE } from './palette';

export type PaletteKey = keyof typeof PALETTE;
export type PixelGridData = (PaletteKey | null)[][];
