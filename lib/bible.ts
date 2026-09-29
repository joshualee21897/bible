import kjv from '../assets/bible/kjv.json';

type BibleData = Record<string, string[][]>;

const bible = kjv as BibleData;

export function getChapterVerses(book: string, chapter: number): string[] {
  const chapters = bible[book];
  if (!chapters) throw new Error(`Unknown book: ${book}`);

  const verses = chapters[chapter - 1];
  if (!verses) throw new Error(`${book} has no chapter ${chapter}`);

  return verses;
}
