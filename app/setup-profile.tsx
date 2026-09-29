import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AVATAR_COLORS } from '../components/pixel/palette';
import { createMyProfile } from '../lib/profile';

export default function SetupProfileScreen() {
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = displayName.trim();
    if (!trimmed) {
      Alert.alert('Add your name', 'Your group will see this name on your check-ins.');
      return;
    }

    setSaving(true);
    try {
      await createMyProfile(trimmed, avatarColor);
      router.replace('/');
    } catch (error) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.body}>What should your group call you?</Text>
      <TextInput style={styles.input} placeholder="Your name" value={displayName} onChangeText={setDisplayName} />
      <Text style={styles.label}>Pick a color</Text>
      <View style={styles.swatchRow}>
        {AVATAR_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => setAvatarColor(color)}
            style={[styles.swatch, { backgroundColor: color }, avatarColor === color && styles.swatchSelected]}
          />
        ))}
      </View>
      <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Continue'}</Text>
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
  label: {
    marginTop: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    maxWidth: 320,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: '#000',
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
