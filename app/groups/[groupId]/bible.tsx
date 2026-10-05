import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BookPickerSheet } from '../../../components/read/BookPickerSheet';
import { buttonBase, COLORS, FONTS } from '../../../components/theme';
import { showAlert } from '../../../lib/alert';
import { BIBLE_BOOKS, getChapterCount } from '../../../lib/bible-books';
import { getChapterVerses } from '../../../lib/bible';
import { useAuth } from '../../../lib/auth-context';
import {
  createCheckin,
  getCurrentChapterNumber,
  getMyCheckedChapters,
  getMyCheckin,
  isBookFinished,
  isEditableToday,
  updateCheckin,
  type Checkin,
} from '../../../lib/checkins';
import { getErrorMessage } from '../../../lib/error-message';
import { changeGroupBook } from '../../../lib/groups';
import { useGroup } from '../../../lib/group-context';
import { useLambMessage } from '../../../lib/lamb-overlay-context';

const MIN_REFLECTION_LENGTH = 10;

function todayAsInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function BibleScreen() {
  const { group, refresh: refreshGroup } = useGroup();
  const { session } = useAuth();

  const maxChapter = group ? getChapterCount(group.book) : 1;
  const todayChapter = group ? getCurrentChapterNumber(group.start_date, maxChapter) : 1;
  const finished = group ? isBookFinished(group.start_date, maxChapter) : false;

  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [nextBook, setNextBook] = useState(BIBLE_BOOKS[0].name);
  const [changingBook, setChangingBook] = useState(false);
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const [checkedChapters, setCheckedChapters] = useState<Set<number>>(new Set());
  const [currentCheckin, setCurrentCheckin] = useState<Checkin | null>(null);
  const [draftText, setDraftText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [bookJustFinished, setBookJustFinished] = useState<string | null>(null);

  useLambMessage(
    bookJustFinished
      ? {
          id: 'bible-book-finished',
          message: `You finished ${bookJustFinished}! Well done, good and faithful servant.`,
          pose: 'happy',
          sparkles: true,
          actions: [{ label: 'Amen', primary: true, onPress: () => setBookJustFinished(null) }],
        }
      : justCheckedIn
        ? { id: 'bible-celebration', message: 'Well done, good and faithful servant.', pose: 'happy', sparkles: true }
        : !currentCheckin
          ? { id: 'bible', message: 'Read, then share one thing God put on your heart.', pose: 'pointing' }
          : null
  );

  // Re-anchor to today's chapter whenever the group's book or start date
  // actually changes (initial load, or after picking a new book) — but not
  // on every render, so a manually selected catch-up chapter sticks.
  useEffect(() => {
    if (group) {
      setSelectedChapter(getCurrentChapterNumber(group.start_date, getChapterCount(group.book)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.book, group?.start_date]);

  const loadChapterState = useCallback(
    async (chapter: number) => {
      if (!group) return;
      setLoading(true);
      try {
        const [checked, checkin] = await Promise.all([
          getMyCheckedChapters(group.id, group.book),
          getMyCheckin(group.id, group.book, chapter),
        ]);
        setCheckedChapters(checked);
        setCurrentCheckin(checkin);
        setDraftText(checkin?.reflection ?? '');
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [group]
  );

  useEffect(() => {
    if (selectedChapter !== null) {
      loadChapterState(selectedChapter);
    }
  }, [selectedChapter, loadChapterState]);

  const verses = useMemo(() => {
    if (!group || selectedChapter === null) return [];
    try {
      return getChapterVerses(group.book, selectedChapter);
    } catch {
      return [];
    }
  }, [group, selectedChapter]);

  const catchUpChapters = useMemo(() => {
    const list: number[] = [];
    for (let chapter = 1; chapter < todayChapter; chapter++) {
      if (!checkedChapters.has(chapter)) list.push(chapter);
    }
    return list;
  }, [todayChapter, checkedChapters]);

  const canSubmit = draftText.trim().length >= MIN_REFLECTION_LENGTH;

  async function handleCheckIn() {
    if (!group || selectedChapter === null || !session || !canSubmit) return;

    setSaving(true);
    try {
      const text = draftText.trim();
      if (currentCheckin) {
        const updated = await updateCheckin(currentCheckin.id, { reflection: text });
        setCurrentCheckin(updated);
      } else {
        const checkin = await createCheckin({
          groupId: group.id,
          book: group.book,
          chapter: selectedChapter,
          reflection: text,
        });
        setCurrentCheckin(checkin);
        const newCheckedCount = checkedChapters.size + 1;
        setCheckedChapters((prev) => new Set(prev).add(selectedChapter));
        if (newCheckedCount === maxChapter) {
          setBookJustFinished(group.book);
        } else {
          setJustCheckedIn(true);
        }
      }
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeBook() {
    if (!group) return;
    setChangingBook(true);
    try {
      await changeGroupBook(group.id, nextBook, todayAsInputDate());
      refreshGroup();
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setChangingBook(false);
    }
  }

  if (!group || selectedChapter === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (finished) {
    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Text style={styles.reference}>You've finished {group.book}!</Text>
        <Text style={styles.label}>Our garden is proud of how far we've come. Pick the next book to keep reading.</Text>
        <Pressable style={styles.bookPickerButton} onPress={() => setBookSheetOpen(true)}>
          <Text style={styles.bookPickerButtonText}>{nextBook}</Text>
          <Text style={styles.bookPickerCaret}>▾</Text>
        </Pressable>
        <BookPickerSheet
          visible={bookSheetOpen}
          selectedBook={nextBook}
          onClose={() => setBookSheetOpen(false)}
          onSelect={(selected) => {
            setNextBook(selected);
            setBookSheetOpen(false);
          }}
        />
        <Pressable style={styles.button} onPress={handleChangeBook} disabled={changingBook}>
          <Text style={styles.buttonText}>{changingBook ? 'Starting…' : `Start reading ${nextBook}`}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const editable = !currentCheckin || isEditableToday(currentCheckin.created_at);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <View style={styles.chapterCard}>
        <View style={styles.chapterHeading}>
          <Text style={styles.chapterHeadingLabel}>Today&apos;s chapter</Text>
          <Text style={styles.kjvBadge}>KJV</Text>
        </View>
        <Text style={styles.reference}>
          {group.book} {selectedChapter}
        </Text>

        {loading ? (
          <ActivityIndicator style={styles.versesLoading} />
        ) : (
          <View style={styles.verses}>
            {verses.map((verse, index) => (
              <Text key={index} style={styles.verseText}>
                <Text style={styles.verseNumber}>{index + 1} </Text>
                {verse}
              </Text>
            ))}
          </View>
        )}
      </View>

      {!loading && (
        <View style={editable ? styles.checkInSection : styles.afterReadSection}>
          {editable ? (
            <>
              <Text style={styles.label}>{currentCheckin ? 'Update your check-in' : "What's on your heart?"}</Text>
              <TextInput
                style={styles.reflectionInput}
                placeholder="What stood out to you today?"
                multiline
                value={draftText}
                onChangeText={setDraftText}
              />
              <Pressable
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleCheckIn}
                disabled={!canSubmit || saving}
              >
                <Text style={styles.buttonText}>
                  {saving ? 'Saving…' : currentCheckin ? 'Save changes' : 'Check in'}
                </Text>
              </Pressable>
              {currentCheckin && (
                <Text style={styles.lockNote}>You can still change this today — it's set once the day ends.</Text>
              )}
            </>
          ) : (
            currentCheckin && (
              <>
                <Text style={styles.doneLabel}>You've checked in for this chapter.</Text>
                <Text style={styles.reflectionReadonly}>{currentCheckin.reflection}</Text>
                <Text style={styles.lockNote}>This check-in is from an earlier day and can't be changed.</Text>
              </>
            )
          )}
        </View>
      )}

      {catchUpChapters.length > 0 && (
        <View style={styles.catchUp}>
          <Text style={styles.label}>Catch up on earlier chapters</Text>
          <View style={styles.catchUpRow}>
            {catchUpChapters.map((chapter) => (
              <Pressable
                key={chapter}
                style={[styles.chip, selectedChapter === chapter && styles.chipSelected]}
                onPress={() => setSelectedChapter(chapter)}
              >
                <Text style={[styles.chipText, selectedChapter === chapter && styles.chipTextSelected]}>
                  {chapter}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {selectedChapter !== todayChapter && (
        <Pressable style={styles.secondaryButton} onPress={() => setSelectedChapter(todayChapter)}>
          <Text style={styles.secondaryButtonText}>Back to today's chapter</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: COLORS.error,
  },
  chapterCard: {
    ...buttonBase,
    backgroundColor: COLORS.white,
    padding: 16,
  },
  chapterHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterHeadingLabel: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
  },
  kjvBadge: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontFamily: FONTS.headingSemiBold,
    fontSize: 11,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.yellow,
    overflow: 'hidden',
  },
  reference: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  versesLoading: {
    marginVertical: 24,
  },
  bookPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    backgroundColor: COLORS.white,
  },
  bookPickerButtonText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  bookPickerCaret: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  verses: {
    gap: 6,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 25,
    fontFamily: FONTS.serif,
    color: COLORS.textPrimary,
  },
  verseNumber: {
    fontSize: 12,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.sageDark,
  },
  button: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.cream,
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  checkInSection: {
    gap: 8,
    marginTop: 8,
  },
  afterReadSection: {
    gap: 8,
    marginTop: 8,
  },
  doneLabel: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.success,
  },
  label: {
    fontFamily: FONTS.headingMedium,
    fontSize: 13,
    marginTop: 8,
    color: COLORS.textPrimary,
  },
  reflectionInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: COLORS.white,
    fontFamily: FONTS.serif,
    color: COLORS.textPrimary,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cream,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  lockNote: {
    marginTop: 2,
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  reflectionReadonly: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    fontStyle: 'italic',
    color: COLORS.textPrimary,
  },
  catchUp: {
    marginTop: 16,
  },
  catchUpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
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
});
