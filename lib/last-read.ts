// Remembers the last book/chapter the person had open on the Read tab, so
// refreshing the page or reopening the tab picks up where they left off.
// Web-only for now (the app's current "Now" phase per CLAUDE.md) — Phase 3's
// native build will need AsyncStorage instead.

const STORAGE_KEY = 'sprout:lastRead';

type LastRead = { book: string; chapter: number };

export function getLastRead(): LastRead | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.book !== 'string' || typeof parsed?.chapter !== 'number') return null;
    return { book: parsed.book, chapter: parsed.chapter };
  } catch {
    return null;
  }
}

export function saveLastRead(book: string, chapter: number): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ book, chapter }));
  } catch {
    // Ignore write failures (e.g. private browsing) — not worth surfacing.
  }
}
