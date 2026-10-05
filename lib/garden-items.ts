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
  { key: 'well', name: 'Well', verse: null, price: 60, kind: 'decoration' },
  { key: 'bench', name: 'Bench', verse: null, price: 40, kind: 'decoration' },
  { key: 'lanterns', name: 'Lamp unto my feet', verse: 'Psalm 119:105', price: 70, kind: 'decoration' },
];

export function getGardenItem(key: string): GardenItem | undefined {
  return GARDEN_ITEMS.find((item) => item.key === key);
}

export function isItemAvailableThisMonth(item: GardenItem, date: Date = new Date()): boolean {
  if (!item.availableMonths || item.availableMonths.length === 0) return true;
  return item.availableMonths.includes(date.getMonth() + 1);
}
