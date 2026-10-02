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

import { LambGuide } from '../../../components/guide/LambGuide';
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

export default function BibleScreen() {
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
  const [justCheckedIn, setJustCheckedIn] = useState(false);

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

  async function checkInWithPhoto(asset: ImagePicker.ImagePickerAsset) {
    if (!group || selectedChapter === null || !session) return;

    setSaving(true);
    try {
      const path = await uploadCheckinPhoto(group.id, session.user.id, asset.uri, asset.mimeType ?? 'image/jpeg');
      const checkin = await createCheckin({
        groupId: group.id,
        book: group.book,
        chapter: selectedChapter,
        photoPath: path,
      });
      setCurrentCheckin(checkin);
      setPhotoUrl(await getSignedPhotoUrl(path));
      setCheckedChapters((prev) => new Set(prev).add(selectedChapter));
      setJustCheckedIn(true);
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAlert('Camera access needed', 'A photo is how you check in — allow camera access to continue.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    await checkInWithPhoto(result.assets[0]);
  }

  async function handleChoosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Photo access needed', 'A photo is how you check in — allow photo access to continue.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    await checkInWithPhoto(result.assets[0]);
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

      {!currentCheckin && (
        <LambGuide
          id="bible"
          message="Read today's chapter, then add a photo to check in."
          pose="pointing"
        />
      )}

      {!loading && !currentCheckin && (
        <View style={styles.checkInSection}>
          <Text style={styles.label}>
            Add a photo — your Bible, your coffee, wherever you're reading — to check in.
          </Text>
          {Platform.OS !== 'web' && (
            <Pressable style={styles.button} onPress={handleTakePhoto} disabled={saving}>
              <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Take a photo to check in'}</Text>
            </Pressable>
          )}
          <Pressable
            style={Platform.OS !== 'web' ? styles.secondaryButton : styles.button}
            onPress={handleChoosePhoto}
            disabled={saving}
          >
            <Text style={Platform.OS !== 'web' ? styles.secondaryButtonText : styles.buttonText}>
              {saving ? 'Saving…' : Platform.OS !== 'web' ? 'Choose from library' : 'Add a photo to check in'}
            </Text>
          </Pressable>
        </View>
      )}

      {justCheckedIn && (
        <LambGuide
          id="bible-celebration"
          message="Well done! Want to share what stood out?"
          pose="happy"
          sparkles
          actions={[
            { label: 'Add a reflection', primary: true, onPress: () => setJustCheckedIn(false) },
            { label: 'Maybe later', onPress: () => setJustCheckedIn(false) },
          ]}
        />
      )}

      {!loading && currentCheckin && (
        <View style={styles.afterReadSection}>
          <Text style={styles.doneLabel}>You've checked in for this chapter.</Text>

          {photoUrl && <Image source={{ uri: photoUrl }} style={styles.photo} />}

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
  bookPicker: {
    flexDirection: 'row',
    marginVertical: 8,
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
    minHeight: 60,
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
