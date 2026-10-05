export type GardenItemKind = 'animal' | 'decoration';

export type GardenItem = {
  key: string;
  name: string;
  verse: string | null;
  price: number;
  kind: GardenItemKind;
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
  { key: 'lanterns', name: 'Lanterns', verse: null, price: 70, kind: 'decoration' },
];

export function getGardenItem(key: string): GardenItem | undefined {
  return GARDEN_ITEMS.find((item) => item.key === key);
}
