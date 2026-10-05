import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { buttonBase, COLORS } from '../components/theme';
import { showAlert } from '../lib/alert';
import { getErrorMessage } from '../lib/error-message';
import { joinGroupByCode } from '../lib/groups';
import { useLambMessage } from '../lib/lamb-overlay-context';

export default function JoinGroupScreen() {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  useLambMessage({
    id: 'join-group',
    message: 'Got a code from a friend? Pop it in here.',
    pose: 'happy',
  });

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
      showAlert('Could not join', getErrorMessage(error));
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
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  body: {
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    width: '100%',
    maxWidth: 320,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 4,
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
  },
  button: {
    ...buttonBase,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
});
