import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BookPickerSheet } from '../components/read/BookPickerSheet';
import { buttonBase, COLORS, FONTS } from '../components/theme';
import { showAlert } from '../lib/alert';
import { BIBLE_BOOKS } from '../lib/bible-books';
import { getErrorMessage } from '../lib/error-message';
import { createGroup } from '../lib/groups';
import { useLambMessage } from '../lib/lamb-overlay-context';

function todayAsInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [book, setBook] = useState(BIBLE_BOOKS[0].name);
  const [startDate, setStartDate] = useState(todayAsInputDate());
  const [weeklyTarget, setWeeklyTarget] = useState('5');
  const [saving, setSaving] = useState(false);
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const submittingRef = useRef(false);

  useLambMessage({
    id: 'create-group',
    message: 'Pick a book and invite friends with the code.',
    pose: 'happy',
  });

  async function handleCreate() {
    // A plain ref check, not just the `saving` state — a fast double-tap can
    // fire this twice before React re-renders the disabled button.
    if (submittingRef.current) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      showAlert('Add a group name', 'Give your group a name your friends will recognize.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      showAlert('Check the start date', 'Enter the date as YYYY-MM-DD, e.g. 2026-10-01.');
      return;
    }
    const parsedTarget = Number.parseInt(weeklyTarget, 10);
    if (!Number.isFinite(parsedTarget) || parsedTarget < 1 || parsedTarget > 7) {
      showAlert('Check the weekly goal', 'Enter a number from 1 to 7.');
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    try {
      const group = await createGroup({
        name: trimmedName,
        book,
        startDate,
        weeklyTarget: parsedTarget,
      });
      router.replace(`/groups/${group.id}`);
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a group</Text>

      <Text style={styles.label}>Group name</Text>
      <TextInput style={styles.input} placeholder="e.g. Cell group" value={name} onChangeText={setName} />

      <Text style={styles.label}>Book</Text>
      <Pressable style={styles.bookPickerButton} onPress={() => setBookSheetOpen(true)}>
        <Text style={styles.bookPickerButtonText}>{book}</Text>
        <Text style={styles.bookPickerCaret}>▾</Text>
      </Pressable>

      <BookPickerSheet
        visible={bookSheetOpen}
        selectedBook={book}
        onClose={() => setBookSheetOpen(false)}
        onSelect={(selected) => {
          setBook(selected);
          setBookSheetOpen(false);
        }}
      />

      <Text style={styles.label}>Start date</Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />

      <Text style={styles.label}>Weekly goal (days per person)</Text>
      <TextInput
        style={styles.input}
        placeholder="5"
        keyboardType="number-pad"
        value={weeklyTarget}
        onChangeText={setWeeklyTarget}
      />

      <Pressable style={styles.button} onPress={handleCreate} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Creating…' : 'Create group'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 24,
    paddingBottom: 60,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    color: COLORS.textPrimary,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
  },
  bookPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
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
  button: {
    ...buttonBase,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
});
