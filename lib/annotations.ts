import { supabase } from './supabase';

export type VerseAnnotation = {
  highlighted: boolean;
  note: string | null;
  color: string | null;
};

export type AnnotationEntry = {
  book: string;
  chapter: number;
  verse: number;
  highlighted: boolean;
  note: string | null;
  color: string | null;
  updated_at: string;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function getChapterAnnotations(
  book: string,
  chapter: number
): Promise<Map<number, VerseAnnotation>> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('bible_annotations')
    .select('verse, highlighted, note, color')
    .eq('user_id', userId)
    .eq('book', book)
    .eq('chapter', chapter);

  if (error) throw error;

  const map = new Map<number, VerseAnnotation>();
  for (const row of data ?? []) {
    map.set(row.verse, { highlighted: row.highlighted, note: row.note, color: row.color });
  }
  return map;
}

// Every verse you've highlighted or added a note to, across every book —
// used by the "My highlights" screen. A row with highlighted=false and no
// note shouldn't show up there (it's just a left-over from un-highlighting).
export async function getAllAnnotations(): Promise<AnnotationEntry[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('bible_annotations')
    .select('book, chapter, verse, highlighted, note, color, updated_at')
    .eq('user_id', userId)
    .or('highlighted.eq.true,note.not.is.null');

  if (error) throw error;
  return (data ?? []) as AnnotationEntry[];
}

async function upsertAnnotation(
  book: string,
  chapter: number,
  verse: number,
  patch: Partial<VerseAnnotation>
): Promise<VerseAnnotation> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('bible_annotations')
    .upsert(
      { user_id: userId, book, chapter, verse, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,book,chapter,verse' }
    )
    .select('highlighted, note, color')
    .single();

  if (error) throw error;
  return data;
}

export async function setHighlight(
  book: string,
  chapter: number,
  verse: number,
  highlighted: boolean,
  color: string | null = null
): Promise<VerseAnnotation> {
  return upsertAnnotation(book, chapter, verse, { highlighted, color });
}

export async function saveNote(
  book: string,
  chapter: number,
  verse: number,
  note: string
): Promise<VerseAnnotation> {
  return upsertAnnotation(book, chapter, verse, { note: note.trim() || null });
}
