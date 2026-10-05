// A group's garden grows through these levels as the group's Storehouse
// fills up. Each costFromPrevious is how many more drops (on top of the
// previous level's total) are needed to reach it — e.g. reaching Sheepfold
// needs 300 + 700 = 1,000 drops ever deposited in total. Keep tweaking this
// list here; nothing else needs to change.
export type GardenLevelDef = {
  index: number;
  key: string;
  name: string;
  verse: string;
  costFromPrevious: number;
};

export const GARDEN_LEVELS: GardenLevelDef[] = [
  { index: 0, key: 'good_ground', name: 'Good Ground', verse: 'Mark 4:8', costFromPrevious: 0 },
  { index: 1, key: 'shepherds_tent', name: "Shepherd's Tent", verse: 'Genesis 12:8', costFromPrevious: 300 },
  { index: 2, key: 'sheepfold', name: 'Sheepfold', verse: 'John 10:16', costFromPrevious: 700 },
  { index: 3, key: 'olive_grove', name: 'Olive Grove', verse: 'Psalm 52:8', costFromPrevious: 1200 },
  { index: 4, key: 'vineyard', name: 'Vineyard', verse: 'John 15:5', costFromPrevious: 2000 },
  { index: 5, key: 'house_on_the_rock', name: 'House on the Rock', verse: 'Matthew 7:24', costFromPrevious: 3500 },
  { index: 6, key: 'like_eden', name: 'Like Eden', verse: 'Isaiah 51:3', costFromPrevious: 5000 },
];

// The total drops that must have ever been deposited (across everyone in
// the group) for the garden to be at least this level.
export function getCumulativeThreshold(index: number): number {
  let total = 0;
  for (let i = 1; i <= index && i < GARDEN_LEVELS.length; i++) {
    total += GARDEN_LEVELS[i].costFromPrevious;
  }
  return total;
}

export type GardenLevelProgress = {
  level: GardenLevelDef;
  nextLevel: GardenLevelDef | null;
  intoTier: number;
  neededForNextTier: number;
  tierPercent: number;
};

// Works out which level a group is at from its running Storehouse total,
// plus how far into the next tier it's gotten — the garden's level is
// never stored, always computed fresh the same way drops and tree stages
// are everywhere else in this app.
export function getLevelForTotal(total: number): GardenLevelProgress {
  let currentIndex = 0;
  for (let i = GARDEN_LEVELS.length - 1; i >= 0; i--) {
    if (total >= getCumulativeThreshold(i)) {
      currentIndex = i;
      break;
    }
  }

  const level = GARDEN_LEVELS[currentIndex];
  const nextLevel = GARDEN_LEVELS[currentIndex + 1] ?? null;
  const intoTier = total - getCumulativeThreshold(currentIndex);
  const neededForNextTier = nextLevel ? nextLevel.costFromPrevious : 0;
  const tierPercent = nextLevel ? Math.min(100, (intoTier / neededForNextTier) * 100) : 100;

  return { level, nextLevel, intoTier, neededForNextTier, tierPercent };
}

export function getGardenLevel(key: string): GardenLevelDef | undefined {
  return GARDEN_LEVELS.find((level) => level.key === key);
}
