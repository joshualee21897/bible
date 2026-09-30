import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { showAlert } from '../lib/alert';
import { joinGroupByCode } from '../lib/groups';

export default function JoinGroupScreen() {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  async function handleJoin() {
    const trimmed = code.trim();
    if (!trimmed) {
      showAlert('Enter an invite code', 'Ask a group member for their 6-character code.');
      return;
    }

    setJoining(true);
    try {
      const group = await joinGroupByCode(trimmed);
      router.replace(`/groups/${group.id}`);
    } catch (error) {
      showAlert('Could not join', error instanceof Error ? error.message : String(error));
    } finally {
      setJoining(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a group</Text>
      <Text style={styles.body}>Enter the invite code a group member shared with you.</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. AB3XQ9"
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={setCode}
      />
      <Pressable style={styles.button} onPress={handleJoin} disabled={joining}>
        <Text style={styles.buttonText}>{joining ? 'Joining…' : 'Join group'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  body: {
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    maxWidth: 320,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
