import type { PreviewGridData } from './preview-types';

// A pixel-exact port of the reference sheep the user supplied: a side-view
// walking sheep with a pale cream face, pink cheek blush, two-tone wool
// (white back, cream belly), and three visible tan legs with hooves.
// Transcribed cell-for-cell from the reference image's 24x21 grid, with its
// colors mapped onto our own palette keys (see preview-palette.ts).
export function buildReferenceLamb(): PreviewGridData {
  return [
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, 'lambOutline', 'lambOutline', 'lambOutline', 'lambOutline', null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, 'lambOutline', 'lambOutline', 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'lambOutline', 'lambOutline', 'lambOutline', 'lambOutline', null, null, null, null],
    [null, null, null, null, null, 'lambOutline', 'lambOutline', null, 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'lambOutline', null, null, null],
    [null, null, null, 'lambOutline', 'lambOutline', 'woolWhite', 'woolWhite', 'lambOutline', 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'lambOutline', null, null, null],
    [null, null, 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'lambOutline', 'lambOutline', null, null],
    [null, 'lambOutline', null, 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'lambOutline', 'woolWhite', 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'lambOutline', null],
    ['lambOutline', 'faceCream', 'lambOutline', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'lambOutline', 'faceCream', 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'lambOutline'],
    ['lambOutline', 'faceCream', 'faceCream', 'faceCream', 'lambOutline', 'faceCream', 'faceCream', 'lambOutline', 'faceCream', 'faceCream', 'faceCream', 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolCream', 'woolCream', 'woolCream', 'lambOutline', null],
    [null, 'lambOutline', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolCream', 'woolCream', 'woolCream', 'lambOutline', null],
    [null, null, 'lambOutline', 'cheekLight', 'faceCream', 'cheekDark', 'cheekDark', 'faceCream', 'cheekLight', 'lambOutline', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolWhite', 'woolCream', 'woolCream', 'lambOutline', null, null],
    [null, null, null, 'lambOutline', 'faceCream', 'faceCream', 'faceCream', 'faceCream', 'lambOutline', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'lambOutline', null],
    [null, null, null, null, 'lambOutline', 'lambOutline', 'lambOutline', 'lambOutline', 'lambOutline', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'lambOutline', null],
    [null, null, null, null, null, null, null, null, 'lambOutline', 'woolCream', 'woolCream', 'woolCream', 'lambOutline', 'woolCream', 'woolCream', 'woolCream', 'woolCream', 'lambOutline', 'lambOutline', 'woolCream', 'woolCream', 'lambOutline', null, null],
    [null, null, null, null, null, null, null, null, null, 'lambOutline', 'lambOutline', 'lambOutline', null, 'lambOutline', 'woolCream', 'woolCream', 'lambOutline', 'lambOutline', 'legTan', 'lambOutline', 'lambOutline', null, null, null],
    [null, null, null, null, null, null, null, null, null, 'lambOutline', 'legTan', 'lambOutline', null, null, 'lambOutline', 'lambOutline', 'lambOutline', 'lambOutline', 'legTan', 'lambOutline', null, null, null, null],
    [null, null, null, null, null, null, null, null, null, 'lambOutline', 'legHoof', 'lambOutline', null, null, 'lambOutline', 'legHoof', 'lambOutline', 'lambOutline', 'legHoof', 'lambOutline', null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, 'lambOutline', null, null, null, null, 'lambOutline', null, null, 'lambOutline', null, null, null, null, null],
  ];
}
