import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LambGuide } from '../components/guide/LambGuide';
import { buttonBase, COLORS } from '../components/theme';
import { showAlert } from '../lib/alert';
import { BIBLE_BOOKS } from '../lib/bible-books';
import { getErrorMessage } from '../lib/error-message';
import { createGroup } from '../lib/groups';

function todayAsInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [book, setBook] = useState(BIBLE_BOOKS[0].name);
  const [startDate, setStartDate] = useState(todayAsInputDate());
  const [weeklyTarget, setWeeklyTarget] = useState('5');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
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
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a group</Text>

      <LambGuide id="create-group" message="Pick a book and invite friends with the code." pose="happy" style={styles.lambGuide} />

      <Text style={styles.label}>Group name</Text>
      <TextInput style={styles.input} placeholder="e.g. Cell group" value={name} onChangeText={setName} />

      <Text style={styles.label}>Book</Text>
      <ScrollView horizontal style={styles.bookPicker} showsHorizontalScrollIndicator={false}>
        {BIBLE_BOOKS.map((b) => (
          <Pressable
            key={b.name}
            onPress={() => setBook(b.name)}
            style={[styles.bookChip, book === b.name && styles.bookChipSelected]}
          >
            <Text style={[styles.bookChipText, book === b.name && styles.bookChipTextSelected]}>{b.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

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
  lambGuide: {
    marginBottom: 16,
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
  bookPicker: {
    flexDirection: 'row',
  },
  bookChip: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: COLORS.surface,
  },
  bookChipSelected: {
    backgroundColor: COLORS.accent,
  },
  bookChipText: {
    color: COLORS.textPrimary,
  },
  bookChipTextSelected: {
    color: COLORS.accentText,
    fontWeight: 'bold',
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
