import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AVATAR_COLORS } from '../components/pixel/palette';
import { buttonBase, COLORS } from '../components/theme';
import { showAlert } from '../lib/alert';
import { useArtStyle, type ArtStyle } from '../lib/art-style-context';
import { useAuth } from '../lib/auth-context';
import { getErrorMessage } from '../lib/error-message';
import { getMyProfile, updateMyProfile } from '../lib/profile';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const { session } = useAuth();
  const { artStyle, setArtStyle } = useArtStyle();
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyProfile().then((profile) => {
      if (profile) {
        setDisplayName(profile.display_name);
        setAvatarColor(profile.avatar_color);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    const trimmed = displayName.trim();
    if (!trimmed) {
      showAlert('Add your name', 'Your group will see this name on your check-ins.');
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile(trimmed, avatarColor);
      router.back();
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.email}>{session?.user.email}</Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

      <Text style={styles.label}>Your color</Text>
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
        <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>

      <Text style={styles.label}>Art style</Text>
      <Text style={styles.helperText}>Experimental — testing a hand-drawn crayon look on the Today tab.</Text>
      <View style={styles.artStyleRow}>
        {(['pixel', 'crayon'] as ArtStyle[]).map((option) => (
          <Pressable
            key={option}
            style={[styles.artStyleOption, artStyle === option && styles.artStyleOptionSelected]}
            onPress={() => setArtStyle(option)}
          >
            <Text style={[styles.artStyleOptionText, artStyle === option && styles.artStyleOptionTextSelected]}>
              {option === 'pixel' ? 'Pixel' : 'Crayon (beta)'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => router.push('/compare-styles')}>
        <Text style={styles.compareLink}>Compare styles →</Text>
      </Pressable>

      <Pressable onPress={handleSignOut}>
        <Text style={styles.signOut}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    paddingTop: 60,
    gap: 6,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  email: {
    color: COLORS.textMuted,
    marginBottom: 12,
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
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
  signOut: {
    marginTop: 20,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  helperText: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  artStyleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  artStyleOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  artStyleOptionSelected: {
    backgroundColor: COLORS.sage,
  },
  artStyleOptionText: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  artStyleOptionTextSelected: {
    color: COLORS.textPrimary,
  },
  compareLink: {
    marginTop: 10,
    color: COLORS.sageDark,
    fontWeight: '600',
  },
});
