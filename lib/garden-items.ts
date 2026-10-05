export type GardenItemKind = 'animal' | 'plant' | 'decoration';

export type GardenItem = {
  key: string;
  name: string;
  verse: string | null;
  price: number;
  kind: GardenItemKind;
  // 1-12 (January-December). Omitted means available all year. Used for
  // items like the Christmas star that should only show in the shop during
  // their season — an already-bought one still stays in the garden either way.
  availableMonths?: number[];
};

// One place to tweak names, verses, and prices.
export const GARDEN_ITEMS: GardenItem[] = [
  { key: 'dove', name: 'Dove', verse: 'Genesis 8:11', price: 50, kind: 'animal' },
  { key: 'sparrow', name: 'Sparrow', verse: 'Matthew 10:29–31', price: 50, kind: 'animal' },
  { key: 'fish', name: 'Fish (in a small pond)', verse: 'John 21:6', price: 80, kind: 'animal' },
  { key: 'raven', name: 'Raven', verse: '1 Kings 17:6', price: 80, kind: 'animal' },
  { key: 'donkey', name: 'Donkey', verse: 'Zechariah 9:9', price: 120, kind: 'animal' },
  { key: 'eagle', name: 'Eagle', verse: 'Isaiah 40:31', price: 150, kind: 'animal' },
  { key: 'lion', name: 'Lion', verse: 'Revelation 5:5', price: 250, kind: 'animal' },
  { key: 'deer', name: 'Deer', verse: 'Psalm 42:1', price: 100, kind: 'animal' },
  { key: 'ram', name: 'Ram', verse: 'Genesis 22:13', price: 90, kind: 'animal' },
  { key: 'hen_and_chicks', name: 'Hen and chicks', verse: 'Matthew 23:37', price: 70, kind: 'animal' },
  { key: 'camel', name: 'Camel', verse: 'Genesis 24:10', price: 150, kind: 'animal' },
  { key: 'ox', name: 'Ox', verse: 'Isaiah 1:3', price: 120, kind: 'animal' },
  { key: 'ant_hill', name: 'Ant hill', verse: 'Proverbs 6:6', price: 20, kind: 'animal' },
  { key: 'beehive', name: 'Beehive', verse: 'Exodus 3:8', price: 60, kind: 'animal' },

  { key: 'lilies', name: 'Lilies of the field', verse: 'Matthew 6:28', price: 30, kind: 'plant' },
  { key: 'fig_tree', name: 'Fig tree', verse: 'Micah 4:4', price: 80, kind: 'plant' },
  { key: 'palm_tree', name: 'Palm tree', verse: 'Psalm 92:12', price: 90, kind: 'plant' },
  { key: 'cedar', name: 'Cedar of Lebanon', verse: 'Psalm 92:12', price: 150, kind: 'plant' },
  { key: 'pomegranate_tree', name: 'Pomegranate tree', verse: 'Exodus 28:33', price: 100, kind: 'plant' },
  { key: 'almond_branch', name: 'Budding almond branch', verse: 'Numbers 17:8', price: 60, kind: 'plant' },

  { key: 'well', name: 'Well', verse: null, price: 60, kind: 'decoration' },
  { key: 'bench', name: 'Bench', verse: null, price: 40, kind: 'decoration' },
  { key: 'lanterns', name: 'Lamp unto my feet', verse: 'Psalm 119:105', price: 70, kind: 'decoration' },
  { key: 'ebenezer_stone', name: "Ebenezer stone", verse: '1 Samuel 7:12', price: 80, kind: 'decoration' },
  { key: 'harvest_table', name: 'Harvest table', verse: 'Psalm 23:5', price: 120, kind: 'decoration' },
  { key: 'shepherds_staff', name: "Shepherd's staff", verse: 'Psalm 23:4', price: 40, kind: 'decoration' },
  { key: 'basket_loaves_fish', name: 'Basket of loaves and fish', verse: 'John 6:9', price: 50, kind: 'decoration' },
  { key: 'fishing_boat', name: 'Fishing boat with net', verse: 'Luke 5:6', price: 150, kind: 'decoration' },
  { key: 'watchtower', name: 'Watchtower', verse: 'Isaiah 5:2', price: 200, kind: 'decoration' },
  { key: 'harp', name: 'Harp', verse: 'Psalm 33:2', price: 90, kind: 'decoration' },
  { key: 'jars_of_clay', name: 'Jars of clay', verse: '2 Corinthians 4:7', price: 30, kind: 'decoration' },

  { key: 'rainbow', name: 'Rainbow', verse: 'Genesis 9:13', price: 100, kind: 'decoration' },
  {
    key: 'christmas_star',
    name: 'Christmas star and manger',
    verse: 'Luke 2:7',
    price: 120,
    kind: 'decoration',
    availableMonths: [12],
  },
  {
    key: 'easter_lilies',
    name: 'Easter lilies',
    verse: null,
    price: 60,
    kind: 'decoration',
    availableMonths: [3, 4],
  },
];

export function getGardenItem(key: string): GardenItem | undefined {
  return GARDEN_ITEMS.find((item) => item.key === key);
}

export function isItemAvailableThisMonth(item: GardenItem, date: Date = new Date()): boolean {
  if (!item.availableMonths || item.availableMonths.length === 0) return true;
  return item.availableMonths.includes(date.getMonth() + 1);
}
