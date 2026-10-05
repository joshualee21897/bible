import { getChapterVerses } from './bible';
import { BIBLE_BOOKS } from './bible-books';

// A few common ways a verse reference might name a book that don't match
// our canonical BIBLE_BOOKS spelling exactly.
const BOOK_NAME_ALIASES: Record<string, string> = {
  psalm: 'Psalms',
  'song of songs': 'Song of Solomon',
};

function resolveBookName(raw: string): string | null {
  const trimmed = raw.trim();
  const alias = BOOK_NAME_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  const match = BIBLE_BOOKS.find((b) => b.name.toLowerCase() === trimmed.toLowerCase());
  return match ? match.name : null;
}

// Matches "Genesis 8:11" or "Matthew 10:29-31" / "Matthew 10:29–31".
const REFERENCE_PATTERN = /^(.+?)\s+(\d+):(\d+)(?:[–-](\d+))?$/;

// Looks up the actual KJV text for a reference like "Genesis 8:11", used to
// show the full verse (not just the reference) in the shop's item detail
// sheet. Returns null if the reference can't be parsed or doesn't exist —
// callers fall back to showing just the reference text.
export function getVerseText(reference: string): string | null {
  const match = reference.match(REFERENCE_PATTERN);
  if (!match) return null;

  const [, bookRaw, chapterRaw, verseStartRaw, verseEndRaw] = match;
  const book = resolveBookName(bookRaw);
  if (!book) return null;

  const chapter = parseInt(chapterRaw, 10);
  const verseStart = parseInt(verseStartRaw, 10);
  const verseEnd = verseEndRaw ? parseInt(verseEndRaw, 10) : verseStart;

  try {
    const verses = getChapterVerses(book, chapter);
    const selected = verses.slice(verseStart - 1, verseEnd);
    if (selected.length === 0) return null;
    return selected.join(' ');
  } catch {
    return null;
  }
}
