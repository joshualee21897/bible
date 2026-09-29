import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BIBLE_BOOKS } from '../lib/bible-books';
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
      Alert.alert('Add a group name', 'Give your group a name your friends will recognize.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert('Check the start date', 'Enter the date as YYYY-MM-DD, e.g. 2026-10-01.');
      return;
    }
    const parsedTarget = Number.parseInt(weeklyTarget, 10);
    if (!Number.isFinite(parsedTarget) || parsedTarget < 1 || parsedTarget > 7) {
      Alert.alert('Check the weekly goal', 'Enter a number from 1 to 7.');
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
      Alert.alert('Something went wrong', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a group</Text>

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
  container: {
    padding: 24,
    paddingTop: 60,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  bookPicker: {
    flexDirection: 'row',
  },
  bookChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  bookChipSelected: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  bookChipText: {
    color: '#111',
  },
  bookChipTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
