import { emptyGrid, paintEllipse, paintRect, setPixel } from './shapes';
import type { PixelGridData } from './types';

const SIZE = 24;

export type DecorationKey =
  | 'well'
  | 'bench'
  | 'fence'
  | 'lanterns'
  | 'ebenezer_stone'
  | 'harvest_table'
  | 'shepherds_staff'
  | 'basket_loaves_fish'
  | 'fishing_boat'
  | 'watchtower'
  | 'harp'
  | 'jars_of_clay'
  | 'rainbow'
  | 'christmas_star'
  | 'easter_lilies';

function buildWell(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 12, 16, 6, 4, 'stoneLight', 'stoneDark');
  paintRect(grid, 3, 6, 5, 12, 'bark');
  paintRect(grid, 19, 6, 21, 12, 'bark');
  paintRect(grid, 3, 4, 21, 6, 'bark');
  return grid;
}

function buildBench(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 3, 12, 21, 15, 'bark');
  paintRect(grid, 4, 18, 6, 20, 'bark');
  paintRect(grid, 18, 18, 20, 20, 'bark');
  return grid;
}

function buildFence(): PixelGridData {
  const grid = emptyGrid(SIZE);
  for (const x of [2, 9, 16]) {
    paintRect(grid, x, 8, x + 2, 20, 'bark');
  }
  paintRect(grid, 1, 10, 22, 12, 'bark');
  paintRect(grid, 1, 15, 22, 17, 'bark');
  return grid;
}

function buildLanterns(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 10, 10, 12, 20, 'bark');
  paintRect(grid, 7, 4, 15, 10, 'goldLight');
  paintRect(grid, 9, 6, 13, 8, 'goldDark', null);
  return grid;
}

// A standing stone marker — "hitherto hath the Lord helped us" (1 Samuel 7:12).
function buildEbenezerStone(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 7, 6, 17, 20, 'stoneLight');
  paintRect(grid, 9, 10, 15, 12, 'stoneDark', null);
  return grid;
}

// A table spread with food — "preparest a table before me" (Psalm 23:5).
function buildHarvestTable(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 2, 14, 21, 17, 'bark');
  paintRect(grid, 4, 17, 6, 22, 'barkShade');
  paintRect(grid, 17, 17, 19, 22, 'barkShade');
  paintEllipse(grid, 8, 12, 2, 1.5, 'fruit');
  paintEllipse(grid, 15, 12, 2, 1.5, 'goldLight');
  return grid;
}

// A long crooked staff — "thy rod and thy staff comfort me" (Psalm 23:4).
function buildShepherdsStaff(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 11, 7, 13, 21, 'bark');
  paintRect(grid, 6, 5, 13, 7, 'bark');
  paintRect(grid, 6, 5, 8, 10, 'bark');
  return grid;
}

// A basket of loaves and a couple of small fish (John 6:9).
function buildBasketLoavesFish(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 12, 17, 8, 4, 'dirtLight');
  paintRect(grid, 4, 13, 20, 17, 'dirtDark', null);
  paintEllipse(grid, 8, 11, 2.4, 1.8, 'goldLight');
  paintEllipse(grid, 13, 10, 2.4, 1.8, 'goldLight');
  paintEllipse(grid, 17, 12, 2.6, 1.4, 'waterDark');
  return grid;
}

// A small boat with a net, after a catch so large it began to sink
// (Luke 5:6).
function buildFishingBoat(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 12, 17, 10, 3, 'bark');
  paintRect(grid, 11, 6, 13, 16, 'barkShade');
  paintRect(grid, 7, 13, 17, 16, 'waterLight', null);
  return grid;
}

// A watchtower built in the vineyard (Isaiah 5:2).
function buildWatchtower(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 7, 4, 17, 22, 'stoneLight');
  paintRect(grid, 5, 2, 19, 5, 'stoneDark');
  paintRect(grid, 10, 9, 14, 12, 'stoneDark', null);
  return grid;
}

// A small harp, "sing unto him with the psaltery" (Psalm 33:2).
function buildHarp(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 5, 4, 7, 20, 'bark');
  paintRect(grid, 16, 10, 18, 20, 'bark');
  paintRect(grid, 5, 4, 18, 6, 'bark');
  for (let x = 8; x <= 15; x += 2) {
    paintRect(grid, x, 6, x, 19, 'goldLight', null);
  }
  return grid;
}

// Plain clay jars holding a treasure (2 Corinthians 4:7).
function buildJarsOfClay(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 8, 16, 4, 6, 'dirtLight');
  paintEllipse(grid, 16, 17, 3.4, 5, 'dirtDark');
  return grid;
}

// A rainbow arc — the sign of the covenant (Genesis 9:13). Each band's
// circle is centered just below the grid so only its top crescent shows.
function buildRainbow(): PixelGridData {
  const grid = emptyGrid(SIZE);
  const bands: { color: Parameters<typeof paintEllipse>[5]; radius: number }[] = [
    { color: 'fruit', radius: 20 },
    { color: 'goldDark', radius: 17 },
    { color: 'goldLight', radius: 14 },
    { color: 'leavesLight', radius: 11 },
    { color: 'waterDark', radius: 8 },
    { color: 'lavender', radius: 5 },
  ];
  for (const band of bands) {
    paintEllipse(grid, 12, 24, band.radius, band.radius, band.color);
  }
  return grid;
}

// A star over the manger (Luke 2:7) — only shown in the shop in December.
function buildChristmasStar(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintRect(grid, 4, 18, 20, 21, 'bark');
  paintRect(grid, 4, 15, 6, 21, 'barkShade');
  paintRect(grid, 18, 15, 20, 21, 'barkShade');
  paintEllipse(grid, 12, 17, 6, 2, 'goldLight');
  setPixel(grid, 12, 3, 'goldLight');
  setPixel(grid, 12, 4, 'goldDark');
  setPixel(grid, 11, 5, 'goldDark');
  setPixel(grid, 13, 5, 'goldDark');
  setPixel(grid, 10, 6, 'goldDark');
  setPixel(grid, 12, 6, 'goldDark');
  setPixel(grid, 14, 6, 'goldDark');
  return grid;
}

// Trumpet lilies — only shown in the shop in March and April. A pale
// lavender tint (rather than near-white) so the petals stay visible
// against the shop's white sprite box, not just their black outline.
function buildEasterLilies(): PixelGridData {
  const grid = emptyGrid(SIZE);
  paintEllipse(grid, 12, 19, 5, 3, 'leavesLight');
  paintEllipse(grid, 7, 11, 2.6, 3.2, 'lavender');
  paintEllipse(grid, 13, 8, 2.6, 3.2, 'lavender');
  paintEllipse(grid, 18, 12, 2.6, 3.2, 'lavender');
  return grid;
}

export function buildDecorationGrid(key: DecorationKey): PixelGridData {
  switch (key) {
    case 'well':
      return buildWell();
    case 'bench':
      return buildBench();
    case 'fence':
      return buildFence();
    case 'lanterns':
      return buildLanterns();
    case 'ebenezer_stone':
      return buildEbenezerStone();
    case 'harvest_table':
      return buildHarvestTable();
    case 'shepherds_staff':
      return buildShepherdsStaff();
    case 'basket_loaves_fish':
      return buildBasketLoavesFish();
    case 'fishing_boat':
      return buildFishingBoat();
    case 'watchtower':
      return buildWatchtower();
    case 'harp':
      return buildHarp();
    case 'jars_of_clay':
      return buildJarsOfClay();
    case 'rainbow':
      return buildRainbow();
    case 'christmas_star':
      return buildChristmasStar();
    case 'easter_lilies':
      return buildEasterLilies();
  }
}
