import { createFlatGrid, finalizeFlatGrid, stampEllipse, stampRect } from './flat-shapes';
import type { PaletteKey, PixelGridData } from './types';

export type AnimalKey =
  | 'dove'
  | 'sparrow'
  | 'fish'
  | 'raven'
  | 'donkey'
  | 'eagle'
  | 'lion'
  | 'deer'
  | 'ram'
  | 'hen_and_chicks'
  | 'camel'
  | 'ox'
  | 'ant_hill'
  | 'beehive';

function buildBird(bodyColor: PaletteKey, bellyColor: PaletteKey, beakColor: PaletteKey): PixelGridData {
  const g = createFlatGrid(24, 24);
  stampEllipse(g, 14, 15, 6, 4.5, bodyColor);
  stampEllipse(g, 16, 17.5, 3.2, 2.6, bellyColor);
  stampEllipse(g, 7, 10, 3.2, 3, bodyColor);
  stampRect(g, 3, 9, 2, 2, beakColor);
  const grid = finalizeFlatGrid(g);
  grid[9][6] = 'outline';
  return grid;
}

// White, with a tiny olive sprig held at the beak (Genesis 8:11).
function buildDove(): PixelGridData {
  const grid = buildBird('woolLight', 'woolCream', 'cheekLight');
  grid[8][2] = 'leavesDark';
  grid[8][1] = 'bark';
  grid[7][1] = 'leavesLight';
  grid[9][1] = 'leavesLight';
  return grid;
}

// Small and plump, with a cream belly and a few darker streaks on its back.
function buildSparrow(): PixelGridData {
  const grid = buildBird('birdDark', 'birdLight', 'goldDark');
  grid[13][11] = 'barkShade';
  grid[14][16] = 'barkShade';
  grid[16][13] = 'barkShade';
  grid[12][15] = 'barkShade';
  return grid;
}

// Glossy black with a blue-purple sheen patch and a thick dark beak.
function buildRaven(): PixelGridData {
  const g = createFlatGrid(24, 24);
  stampEllipse(g, 14, 15, 6, 4.5, 'ravenBlack');
  stampEllipse(g, 16, 17, 3.2, 2.4, 'ravenHighlight');
  stampEllipse(g, 7, 10, 3.2, 3, 'ravenBlack');
  stampRect(g, 3, 9, 2, 2, 'outline');
  const grid = finalizeFlatGrid(g);
  grid[9][6] = 'woolLight';
  return grid;
}

// An orange fish mid-leap, with a splash, over a round blue pond.
function buildFish(): PixelGridData {
  const pondShape = createFlatGrid(24, 24);
  stampEllipse(pondShape, 12, 19, 9, 3.2, 'waterLight');
  const grid = finalizeFlatGrid(pondShape);

  const fishShape = createFlatGrid(24, 24);
  stampEllipse(fishShape, 13, 12, 6, 3.6, 'fishOrange');
  stampEllipse(fishShape, 13, 13.3, 5, 1.6, 'fishOrangeDark');
  stampEllipse(fishShape, 5.5, 12, 2.4, 3, 'fishOrange');
  const fishGrid = finalizeFlatGrid(fishShape);

  for (let y = 0; y < fishGrid.length; y++) {
    for (let x = 0; x < fishGrid[0].length; x++) {
      if (fishGrid[y][x]) grid[y][x] = fishGrid[y][x];
    }
  }
  grid[11][17] = 'outline';
  grid[8][18] = 'waterLight';
  grid[9][20] = 'waterLight';
  grid[7][9] = 'waterLight';
  grid[16][21] = 'waterLight';
  return grid;
}

// Grey, with long upright ears, a white muzzle and belly, and a short dark
// mane (Zechariah 9:9).
function buildDonkey(): PixelGridData {
  const g = createFlatGrid(24, 22);
  stampEllipse(g, 14, 11, 7, 5, 'donkeyGray');
  stampEllipse(g, 16, 14.5, 4, 2.2, 'woolLight');
  stampEllipse(g, 6, 8, 3.5, 3.5, 'donkeyGray');
  stampEllipse(g, 4.5, 9.5, 1.8, 1.6, 'woolLight');
  stampEllipse(g, 4, 2.5, 1.3, 3, 'donkeyGrayDark');
  stampEllipse(g, 8, 2.5, 1.3, 3, 'donkeyGrayDark');
  stampRect(g, 7, 6, 4, 1.5, 'barkShade');
  stampRect(g, 8, 15, 1, 5, 'donkeyGrayDark');
  stampRect(g, 12, 15, 1, 5, 'donkeyGrayDark');
  stampRect(g, 17, 15, 1, 5, 'donkeyGrayDark');
  stampRect(g, 20, 15, 1, 5, 'donkeyGrayDark');
  const grid = finalizeFlatGrid(g);
  grid[8][5] = 'outline';
  grid[11][21] = 'outline';
  grid[12][21] = 'outline';
  return grid;
}

// Brown body, white head, yellow hooked beak, wings spread wide
// (Isaiah 40:31) — viewed head-on, the classic "spread eagle" pose.
function buildEagle(): PixelGridData {
  const g = createFlatGrid(28, 20);
  stampEllipse(g, 14, 12, 3.5, 5, 'bark');
  stampEllipse(g, 14, 15.5, 2.3, 2.3, 'barkShade');
  stampEllipse(g, 14, 6.5, 3, 2.8, 'woolLight');
  stampRect(g, 13, 4.5, 2, 2, 'goldDark');
  stampEllipse(g, 9, 9, 4, 2, 'barkShade');
  stampEllipse(g, 3.5, 7, 3, 1.6, 'barkShade');
  stampEllipse(g, 19, 9, 4, 2, 'barkShade');
  stampEllipse(g, 24.5, 7, 3, 1.6, 'barkShade');
  const grid = finalizeFlatGrid(g);
  grid[6][13] = 'outline';
  return grid;
}

// Golden body, a big round orange-brown mane, a tufted tail, sitting
// (Revelation 5:5).
function buildLion(): PixelGridData {
  const g = createFlatGrid(24, 22);
  stampEllipse(g, 7, 9, 6, 6, 'maneBrown');
  stampEllipse(g, 7, 9, 4.2, 4.2, 'goldLight');
  stampEllipse(g, 14, 15, 7, 5.5, 'goldDark');
  stampEllipse(g, 14, 12, 5, 4, 'goldLight');
  stampRect(g, 20, 13, 1, 6, 'goldDark');
  stampEllipse(g, 21, 20, 1.8, 1.8, 'maneBrown');
  const grid = finalizeFlatGrid(g);
  grid[8][5] = 'outline';
  grid[8][9] = 'outline';
  return grid;
}

// Brown body with small antlers, panting after water brooks (Psalm 42:1).
function buildDeer(): PixelGridData {
  const g = createFlatGrid(24, 22);
  stampEllipse(g, 14, 12, 6, 4, 'bark');
  stampEllipse(g, 16, 14.5, 3, 2, 'barkShade');
  stampEllipse(g, 6, 8, 3, 3, 'bark');
  stampRect(g, 4, 2, 1, 4, 'barkShade');
  stampRect(g, 7, 2, 1, 4, 'barkShade');
  stampRect(g, 8, 15, 1, 5, 'barkShade');
  stampRect(g, 12, 15, 1, 5, 'barkShade');
  stampRect(g, 17, 15, 1, 5, 'barkShade');
  stampRect(g, 20, 15, 1, 5, 'barkShade');
  const grid = finalizeFlatGrid(g);
  grid[8][5] = 'outline';
  return grid;
}

// Cream-white with curled horns, caught in the thicket (Genesis 22:13).
function buildRam(): PixelGridData {
  const g = createFlatGrid(24, 20);
  stampEllipse(g, 14, 11, 6.5, 5, 'woolLight');
  stampEllipse(g, 16, 14, 3, 2, 'woolShade');
  stampEllipse(g, 6, 8, 3.2, 3, 'faceCream');
  stampEllipse(g, 4, 6, 1.8, 1.8, 'bark');
  stampEllipse(g, 3, 9, 1.4, 1.4, 'barkShade');
  stampRect(g, 8, 14, 1, 5, 'legTan');
  stampRect(g, 12, 14, 1, 5, 'legTan');
  stampRect(g, 17, 14, 1, 5, 'legTan');
  stampRect(g, 20, 14, 1, 5, 'legTan');
  const grid = finalizeFlatGrid(g);
  grid[7][5] = 'outline';
  return grid;
}

// A hen gathering her chicks under her wing (Matthew 23:37).
function buildHenAndChicks(): PixelGridData {
  const g = createFlatGrid(24, 20);
  stampEllipse(g, 13, 12, 6, 4.5, 'birdDark');
  stampEllipse(g, 15, 14, 3, 2, 'birdLight');
  stampEllipse(g, 7, 8, 3, 2.8, 'birdDark');
  stampRect(g, 3, 8, 2, 1.5, 'goldDark');
  const grid = finalizeFlatGrid(g);
  grid[7][6] = 'outline';

  const chicksShape = createFlatGrid(24, 20);
  stampEllipse(chicksShape, 4, 18, 1.8, 1.6, 'goldLight');
  stampEllipse(chicksShape, 8.5, 18.5, 1.8, 1.6, 'goldLight');
  stampEllipse(chicksShape, 13, 18, 1.8, 1.6, 'goldLight');
  const chicksGrid = finalizeFlatGrid(chicksShape);
  for (let y = 0; y < chicksGrid.length; y++) {
    for (let x = 0; x < chicksGrid[0].length; x++) {
      if (chicksGrid[y][x]) grid[y][x] = chicksGrid[y][x];
    }
  }
  return grid;
}

// Tan with a hump, ready for the journey (Genesis 24:10).
function buildCamel(): PixelGridData {
  const g = createFlatGrid(24, 22);
  stampEllipse(g, 13, 13, 6, 4, 'dirtLight');
  stampEllipse(g, 11, 8, 3.2, 3.4, 'dirtLight');
  stampRect(g, 4, 6, 2, 8, 'dirtLight');
  stampEllipse(g, 4, 5, 2.4, 2.2, 'dirtLight');
  stampRect(g, 8, 17, 1, 4, 'dirtDark');
  stampRect(g, 12, 17, 1, 4, 'dirtDark');
  stampRect(g, 17, 17, 1, 4, 'dirtDark');
  stampRect(g, 20, 17, 1, 4, 'dirtDark');
  const grid = finalizeFlatGrid(g);
  grid[4][3] = 'outline';
  return grid;
}

// Sturdy and dark, the ox who knows its owner (Isaiah 1:3).
function buildOx(): PixelGridData {
  const g = createFlatGrid(24, 20);
  stampEllipse(g, 14, 11, 7, 4.5, 'barkShade');
  stampEllipse(g, 6, 8, 3.4, 3, 'barkShade');
  stampRect(g, 3, 6, 1, 1.5, 'woolLight');
  stampRect(g, 8, 6, 1, 1.5, 'woolLight');
  stampRect(g, 8, 14, 1, 5, 'outline');
  stampRect(g, 12, 14, 1, 5, 'outline');
  stampRect(g, 17, 14, 1, 5, 'outline');
  stampRect(g, 20, 14, 1, 5, 'outline');
  const grid = finalizeFlatGrid(g);
  grid[7][5] = 'woolLight';
  return grid;
}

// A small mound with a trail of tiny ants, considered wise (Proverbs 6:6).
function buildAntHill(): PixelGridData {
  const g = createFlatGrid(24, 24);
  stampEllipse(g, 12, 18, 9, 5, 'dirtLight');
  stampEllipse(g, 12, 16, 6, 3, 'dirtDark');
  const grid = finalizeFlatGrid(g);
  grid[12][6] = 'outline';
  grid[13][9] = 'outline';
  grid[11][16] = 'outline';
  grid[14][19] = 'outline';
  return grid;
}

// A stack of golden hive domes, land flowing with honey (Exodus 3:8).
// Each tier alternates shade so the stack reads as rings, not one blob.
function buildBeehive(): PixelGridData {
  const g = createFlatGrid(24, 24);
  stampEllipse(g, 12, 20, 7, 3.5, 'goldDark');
  stampEllipse(g, 12, 15.5, 5.6, 3, 'goldLight');
  stampEllipse(g, 12, 11.5, 4.2, 2.6, 'goldDark');
  stampEllipse(g, 12, 8, 2.8, 2.4, 'goldLight');
  const grid = finalizeFlatGrid(g);
  grid[13][6] = 'outline';
  grid[9][18] = 'outline';
  return grid;
}

export function buildAnimalGrid(key: AnimalKey): PixelGridData {
  switch (key) {
    case 'dove':
      return buildDove();
    case 'sparrow':
      return buildSparrow();
    case 'raven':
      return buildRaven();
    case 'fish':
      return buildFish();
    case 'donkey':
      return buildDonkey();
    case 'eagle':
      return buildEagle();
    case 'lion':
      return buildLion();
    case 'deer':
      return buildDeer();
    case 'ram':
      return buildRam();
    case 'hen_and_chicks':
      return buildHenAndChicks();
    case 'camel':
      return buildCamel();
    case 'ox':
      return buildOx();
    case 'ant_hill':
      return buildAntHill();
    case 'beehive':
      return buildBeehive();
  }
}
