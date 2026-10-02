import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BookPickerSheet } from '../../components/read/BookPickerSheet';
import { ChapterPickerSheet } from '../../components/read/ChapterPickerSheet';
import { NoteSheet } from '../../components/read/NoteSheet';
import { LambGuide } from '../../components/guide/LambGuide';
import { COLORS, FONTS, HARD_SHADOW } from '../../components/theme';
import { getChapterAnnotations, saveNote, setHighlight, type VerseAnnotation } from '../../lib/annotations';
import { getChapterVerses } from '../../lib/bible';
import { BIBLE_BOOKS, getChapterCount } from '../../lib/bible-books';
import { getErrorMessage } from '../../lib/error-message';

export default function ReadScreen() {
  const [book, setBook] = useState(BIBLE_BOOKS[0].name);
  const [chapter, setChapter] = useState(1);
  const [annotations, setAnnotations] = useState<Map<number, VerseAnnotation>>(new Map());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noteSheet, setNoteSheet] = useState<{ verse: number } | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const [chapterSheetOpen, setChapterSheetOpen] = useState(false);

  const maxChapter = getChapterCount(book);

  const load = useCallback(async (b: string, c: number) => {
    setLoading(true);
    try {
      const map = await getChapterAnnotations(b, c);
      setAnnotations(map);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(book, chapter);
  }, [book, chapter, load]);

  const verses = useMemo(() => {
    try {
      return getChapterVerses(book, chapter);
    } catch {
      return [];
    }
  }, [book, chapter]);

  async function toggleHighlight(verse: number) {
    const current = annotations.get(verse)?.highlighted ?? false;
    setAnnotations((prev) => {
      const next = new Map(prev);
      next.set(verse, { highlighted: !current, note: prev.get(verse)?.note ?? null });
      return next;
    });
    try {
      await setHighlight(book, chapter, verse, !current);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setAnnotations((prev) => {
        const next = new Map(prev);
        next.set(verse, { highlighted: current, note: prev.get(verse)?.note ?? null });
        return next;
      });
    }
  }

  async function handleSaveNote(verse: number, note: string) {
    setSavingNote(true);
    try {
      await saveNote(book, chapter, verse, note);
      setAnnotations((prev) => {
        const next = new Map(prev);
        next.set(verse, { highlighted: prev.get(verse)?.highlighted ?? false, note: note.trim() || null });
        return next;
      });
      setNoteSheet(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Read</Text>

      <LambGuide
        id="read"
        message="Tap a verse number to highlight it, or ✎ to add a note."
        pose="pointing"
        style={styles.lambGuide}
      />

      <View style={styles.pickerRow}>
        <Pressable style={styles.bookPill} onPress={() => setBookSheetOpen(true)}>
          <Text style={styles.pickerPillText} numberOfLines={1}>
            {book}
          </Text>
          <Text style={styles.pickerCaret}>▾</Text>
        </Pressable>
        <Pressable style={styles.chapterPill} onPress={() => setChapterSheetOpen(true)}>
          <Text style={styles.pickerPillText}>{chapter}</Text>
          <Text style={styles.pickerCaret}>▾</Text>
        </Pressable>
        <View style={styles.navArrows}>
          <Pressable
            style={[styles.navArrow, chapter <= 1 && styles.navArrowDisabled]}
            disabled={chapter <= 1}
            onPress={() => setChapter((c) => c - 1)}
          >
            <Text style={styles.navArrowText}>‹</Text>
          </Pressable>
          <Pressable
            style={[styles.navArrow, chapter >= maxChapter && styles.navArrowDisabled]}
            disabled={chapter >= maxChapter}
            onPress={() => setChapter((c) => c + 1)}
          >
            <Text style={styles.navArrowText}>›</Text>
          </Pressable>
        </View>
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <ScrollView style={styles.versesScroll} contentContainerStyle={styles.versesContent}>
        {loading ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          verses.map((verseText, index) => {
            const verseNumber = index + 1;
            const annotation = annotations.get(verseNumber);
            return (
              <View key={verseNumber} style={styles.verseRow}>
                <Pressable onPress={() => toggleHighlight(verseNumber)} hitSlop={6}>
                  <Text style={styles.verseNumber}>{verseNumber}</Text>
                </Pressable>
                <Text style={[styles.verseText, annotation?.highlighted && styles.verseTextHighlighted]}>
                  {verseText}
                </Text>
                <Pressable onPress={() => setNoteSheet({ verse: verseNumber })} hitSlop={6}>
                  <Text style={[styles.noteGlyph, annotation?.note && styles.noteGlyphActive]}>✎</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <NoteSheet
        visible={noteSheet !== null}
        verseLabel={noteSheet ? `${book} ${chapter}:${noteSheet.verse}` : ''}
        initialNote={noteSheet ? (annotations.get(noteSheet.verse)?.note ?? '') : ''}
        saving={savingNote}
        onClose={() => setNoteSheet(null)}
        onSave={(note) => noteSheet && handleSaveNote(noteSheet.verse, note)}
      />

      <BookPickerSheet
        visible={bookSheetOpen}
        selectedBook={book}
        onClose={() => setBookSheetOpen(false)}
        onSelect={(selected) => {
          setBook(selected);
          setChapter(1);
          setBookSheetOpen(false);
        }}
      />

      <ChapterPickerSheet
        visible={chapterSheetOpen}
        book={book}
        maxChapter={maxChapter}
        selectedChapter={chapter}
        onClose={() => setChapterSheetOpen(false)}
        onSelect={(selected) => {
          setChapter(selected);
          setChapterSheetOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  lambGuide: {
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bookPill: {
    ...HARD_SHADOW,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },
  chapterPill: {
    ...HARD_SHADOW,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },
  pickerPillText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  pickerCaret: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  navArrows: {
    flexDirection: 'row',
    gap: 4,
  },
  navArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.sage,
  },
  navArrowDisabled: {
    backgroundColor: COLORS.cream,
    opacity: 0.5,
  },
  navArrowText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  error: {
    color: COLORS.error,
    marginBottom: 8,
  },
  versesScroll: {
    flex: 1,
  },
  versesContent: {
    paddingBottom: 40,
  },
  loading: {
    marginVertical: 24,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  verseNumber: {
    marginTop: 3,
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.sageDark,
    minWidth: 16,
  },
  verseText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: FONTS.serif,
    color: COLORS.textPrimary,
  },
  verseTextHighlighted: {
    backgroundColor: COLORS.yellow,
  },
  noteGlyph: {
    marginTop: 3,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  noteGlyphActive: {
    color: COLORS.accentText,
  },
});
