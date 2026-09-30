import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { buttonBase, COLORS } from '../../../components/theme';
import { showAlert } from '../../../lib/alert';
import { BIBLE_BOOKS, getChapterCount } from '../../../lib/bible-books';
import { getChapterVerses } from '../../../lib/bible';
import { useAuth } from '../../../lib/auth-context';
import {
  createCheckin,
  getCurrentChapterNumber,
  getMyCheckedChapters,
  getMyCheckin,
  getSignedPhotoUrl,
  isBookFinished,
  updateCheckin,
  uploadCheckinPhoto,
  type Checkin,
} from '../../../lib/checkins';
import { getErrorMessage } from '../../../lib/error-message';
import { changeGroupBook } from '../../../lib/groups';
import { useGroup } from '../../../lib/group-context';

function todayAsInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayScreen() {
  const { group, refresh: refreshGroup } = useGroup();
  const { session } = useAuth();

  const maxChapter = group ? getChapterCount(group.book) : 1;
  const todayChapter = group ? getCurrentChapterNumber(group.start_date, maxChapter) : 1;
  const finished = group ? isBookFinished(group.start_date, maxChapter) : false;

  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [nextBook, setNextBook] = useState(BIBLE_BOOKS[0].name);
  const [changingBook, setChangingBook] = useState(false);
  const [checkedChapters, setCheckedChapters] = useState<Set<number>>(new Set());
  const [currentCheckin, setCurrentCheckin] = useState<Checkin | null>(null);
  const [reflectionDraft, setReflectionDraft] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        setReflectionDraft(checkin?.reflection ?? '');
        if (checkin?.photo_path) {
          setPhotoUrl(await getSignedPhotoUrl(checkin.photo_path));
        } else {
          setPhotoUrl(null);
        }
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

  async function handleMarkAsRead() {
    if (!group || selectedChapter === null) return;
    setSaving(true);
    try {
      const checkin = await createCheckin({ groupId: group.id, book: group.book, chapter: selectedChapter });
      setCurrentCheckin(checkin);
      setCheckedChapters((prev) => new Set(prev).add(selectedChapter));
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveReflection() {
    if (!currentCheckin) return;
    setSaving(true);
    try {
      const updated = await updateCheckin(currentCheckin.id, { reflection: reflectionDraft.trim() || null });
      setCurrentCheckin(updated);
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPhoto() {
    if (!currentCheckin || !group || !session) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Photo access needed', 'Allow photo access to add a picture to your check-in.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setSaving(true);
    try {
      const path = await uploadCheckinPhoto(group.id, session.user.id, asset.uri, asset.mimeType ?? 'image/jpeg');
      const updated = await updateCheckin(currentCheckin.id, { photoPath: path });
      setCurrentCheckin(updated);
      setPhotoUrl(await getSignedPhotoUrl(path));
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
        <ScrollView horizontal style={styles.bookPicker} showsHorizontalScrollIndicator={false}>
          {BIBLE_BOOKS.map((b) => (
            <Pressable
              key={b.name}
              onPress={() => setNextBook(b.name)}
              style={[styles.chip, nextBook === b.name && styles.chipSelected]}
            >
              <Text style={[styles.chipText, nextBook === b.name && styles.chipTextSelected]}>{b.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={styles.button} onPress={handleChangeBook} disabled={changingBook}>
          <Text style={styles.buttonText}>{changingBook ? 'Starting…' : `Start reading ${nextBook}`}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

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

      {!loading && !currentCheckin && (
        <Pressable style={styles.button} onPress={handleMarkAsRead} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving…' : "I've read today's chapter"}</Text>
        </Pressable>
      )}

      {!loading && currentCheckin && (
        <View style={styles.afterReadSection}>
          <Text style={styles.doneLabel}>You've checked in for this chapter.</Text>

          <Text style={styles.label}>Reflection (optional)</Text>
          <TextInput
            style={styles.reflectionInput}
            placeholder="What stood out to you?"
            multiline
            value={reflectionDraft}
            onChangeText={setReflectionDraft}
          />
          <Pressable style={styles.secondaryButton} onPress={handleSaveReflection} disabled={saving}>
            <Text style={styles.secondaryButtonText}>Post reflection</Text>
          </Pressable>

          <Text style={styles.label}>Photo (optional)</Text>
          {photoUrl && <Image source={{ uri: photoUrl }} style={styles.photo} />}
          <Pressable style={styles.secondaryButton} onPress={handlePickPhoto} disabled={saving}>
            <Text style={styles.secondaryButtonText}>
              {Platform.OS === 'web' ? 'Choose a photo' : 'Add a photo'}
            </Text>
          </Pressable>
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
  reference: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  versesLoading: {
    marginVertical: 24,
  },
  bookPicker: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  verses: {
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
  },
  verseText: {
    fontSize: 17,
    lineHeight: 26,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
    color: COLORS.textPrimary,
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  button: {
    ...buttonBase,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
  afterReadSection: {
    gap: 8,
    marginTop: 8,
  },
  doneLabel: {
    fontWeight: '600',
    color: COLORS.success,
  },
  label: {
    fontWeight: '600',
    marginTop: 8,
    color: COLORS.textPrimary,
  },
  reflectionInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAccent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.accentText,
    fontWeight: 'bold',
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
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
    backgroundColor: COLORS.surface,
  },
  chipSelected: {
    backgroundColor: COLORS.accent,
  },
  chipText: {
    color: COLORS.textPrimary,
  },
  chipTextSelected: {
    color: COLORS.accentText,
    fontWeight: 'bold',
  },
});
