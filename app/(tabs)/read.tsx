import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NoteSheet } from '../../components/read/NoteSheet';
import { LambGuide } from '../../components/guide/LambGuide';
import { buttonBase, COLORS, FONTS } from '../../components/theme';
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

      <ScrollView horizontal style={styles.bookPicker} showsHorizontalScrollIndicator={false}>
        {BIBLE_BOOKS.map((b) => (
          <Pressable
            key={b.name}
            onPress={() => {
              setBook(b.name);
              setChapter(1);
            }}
            style={[styles.chip, book === b.name && styles.chipSelected]}
          >
            <Text style={[styles.chipText, book === b.name && styles.chipTextSelected]}>{b.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal style={styles.chapterPicker} showsHorizontalScrollIndicator={false}>
        {Array.from({ length: maxChapter }, (_, index) => index + 1).map((c) => (
          <Pressable
            key={c}
            onPress={() => setChapter(c)}
            style={[styles.chapterChip, chapter === c && styles.chipSelected]}
          >
            <Text style={[styles.chipText, chapter === c && styles.chipTextSelected]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <ScrollView style={styles.versesScroll} contentContainerStyle={styles.versesContent}>
        <Text style={styles.reference}>
          {book} {chapter}
        </Text>

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
  bookPicker: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chapterPicker: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chip: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  chapterChip: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    minWidth: 36,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  chipSelected: {
    backgroundColor: COLORS.lavender,
  },
  chipText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  chipTextSelected: {
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
  reference: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    marginBottom: 10,
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
