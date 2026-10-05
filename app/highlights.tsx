import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS, HARD_SHADOW, buttonBase } from '../components/theme';
import { getAllAnnotations, type AnnotationEntry } from '../lib/annotations';
import { BIBLE_BOOKS } from '../lib/bible-books';
import { getErrorMessage } from '../lib/error-message';
import { timeAgo } from '../lib/time-ago';

type SortMode = 'recent' | 'book';

function EntryRow({ entry }: { entry: AnnotationEntry }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/read', params: { book: entry.book, chapter: String(entry.chapter) } })}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.reference}>
          {entry.book} {entry.chapter}:{entry.verse}
        </Text>
        {entry.highlighted && <View style={styles.highlightSwatch} />}
      </View>
      {entry.note && <Text style={styles.note}>{entry.note}</Text>}
      <Text style={styles.time}>{timeAgo(entry.updated_at)}</Text>
    </Pressable>
  );
}

export default function HighlightsScreen() {
  const [entries, setEntries] = useState<AnnotationEntry[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const load = useCallback(async () => {
    try {
      const data = await getAllAnnotations();
      setEntries(data);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (errorMessage && !entries) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMessage}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!entries) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const sortedByRecent = [...entries].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const byBook = BIBLE_BOOKS.map((book) => ({
    book: book.name,
    entries: entries
      .filter((entry) => entry.book === book.name)
      .sort((a, b) => a.chapter - b.chapter || a.verse - b.verse),
  })).filter((group) => group.entries.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, sortMode === 'recent' && styles.toggleButtonActive]}
          onPress={() => setSortMode('recent')}
        >
          <Text style={[styles.toggleText, sortMode === 'recent' && styles.toggleTextActive]}>Recent</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, sortMode === 'book' && styles.toggleButtonActive]}
          onPress={() => setSortMode('book')}
        >
          <Text style={[styles.toggleText, sortMode === 'book' && styles.toggleTextActive]}>By book</Text>
        </Pressable>
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <ScrollView contentContainerStyle={styles.list}>
        {entries.length === 0 && (
          <Text style={styles.empty}>
            Nothing yet — tap a verse number on the Read tab to highlight it, or ✎ to add a note.
          </Text>
        )}

        {sortMode === 'recent'
          ? sortedByRecent.map((entry) => <EntryRow key={`${entry.book}-${entry.chapter}-${entry.verse}`} entry={entry} />)
          : byBook.map((group) => (
              <View key={group.book} style={styles.bookGroup}>
                <Text style={styles.bookHeading}>{group.book}</Text>
                {group.entries.map((entry) => (
                  <EntryRow key={`${entry.book}-${entry.chapter}-${entry.verse}`} entry={entry} />
                ))}
              </View>
            ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  error: {
    color: COLORS.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggleButton: {
    ...buttonBase,
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.sage,
  },
  toggleText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  toggleTextActive: {
    color: COLORS.textPrimary,
  },
  list: {
    gap: 10,
    paddingBottom: 40,
  },
  empty: {
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  bookGroup: {
    gap: 8,
  },
  bookHeading: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  row: {
    ...HARD_SHADOW,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    gap: 4,
    backgroundColor: COLORS.white,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reference: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  highlightSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.yellow,
  },
  note: {
    fontFamily: FONTS.serifItalic,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  time: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
