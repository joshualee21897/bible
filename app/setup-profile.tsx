import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AVATAR_COLORS } from '../components/pixel/palette';
import { buttonBase, COLORS } from '../components/theme';
import { showAlert } from '../lib/alert';
import { getErrorMessage } from '../lib/error-message';
import { createMyProfile } from '../lib/profile';

export default function SetupProfileScreen() {
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = displayName.trim();
    if (!trimmed) {
      showAlert('Add your name', 'Your group will see this name on your check-ins.');
      return;
    }

    setSaving(true);
    try {
      await createMyProfile(trimmed, avatarColor);
      router.replace('/');
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
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
  label: {
    marginTop: 8,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
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
    borderColor: COLORS.border,
  },
  button: {
    ...buttonBase,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
});
