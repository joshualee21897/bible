import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Lamb } from '../components/pixel/Lamb';
import { Tree } from '../components/pixel/Tree';
import { buttonBase, COLORS, FONTS } from '../components/theme';
import { showAlert } from '../lib/alert';
import { useAuth } from '../lib/auth-context';
import { getErrorMessage } from '../lib/error-message';
import { supabase } from '../lib/supabase';

function Cloud({ top, left, right, scale = 1 }: { top: number; left?: number; right?: number; scale?: number }) {
  return (
    <View style={[styles.cloudWrap, { top, left, right, transform: [{ scale }] }]}>
      <View style={styles.cloudBase} />
      <View style={styles.cloudBumpLeft} />
      <View style={styles.cloudBumpRight} />
    </View>
  );
}

export default function SignInScreen() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/" />;
  }

  async function handleSendLink() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: trimmedEmail });
      if (error) {
        showAlert('Something went wrong', error.message);
        return;
      }
      setSent(true);
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.sky}>
        <Cloud top={40} left={24} />
        <Cloud top={92} right={-8} scale={0.75} />
        <View style={styles.sun} />
        <View style={styles.hero}>
          <View style={styles.mascotScene}>
            <Lamb pixelSize={3} />
            <Tree stage="sprout" pixelSize={3} />
          </View>
          <Text style={styles.heroTitle}>Flock</Text>
          <Text style={styles.heroSubtitle}>Stay in the Word, together.</Text>
        </View>
      </View>

      <View style={styles.grass}>
        <View style={styles.card}>
          {sent ? (
            <>
              <Text style={styles.cardLabel}>✓ Link sent gently</Text>
              <Text style={styles.note}>We sent a sign-in link to {email}. Open it on this device to continue.</Text>
            </>
          ) : (
            <>
              <Text style={styles.cardLabel}>Email address</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputGlyph}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <Pressable style={styles.button} onPress={handleSendLink} disabled={sending}>
                <Text style={styles.buttonText}>{sending ? 'Sending…' : 'Send me a sign-in link'}</Text>
              </Pressable>
              <Text style={styles.note}>
                No password to remember. We&apos;ll send a one-time link to your inbox.
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.sky,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sky: {
    height: 320,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.sky,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  cloudWrap: {
    position: 'absolute',
    width: 62,
    height: 45,
  },
  cloudBase: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 62,
    height: 20,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    opacity: 0.85,
  },
  cloudBumpLeft: {
    position: 'absolute',
    bottom: 0,
    left: 9,
    width: 20,
    height: 30,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    opacity: 0.85,
  },
  cloudBumpRight: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    width: 25,
    height: 25,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    opacity: 0.85,
  },
  sun: {
    position: 'absolute',
    top: 36,
    right: 44,
    width: 38,
    height: 38,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.yellow,
  },
  hero: {
    alignItems: 'center',
    gap: 2,
  },
  mascotScene: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    height: 70,
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 38,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
  },
  grass: {
    flex: 1,
    backgroundColor: COLORS.grass,
    padding: 24,
    paddingTop: 36,
  },
  card: {
    ...buttonBase,
    backgroundColor: COLORS.cream,
    borderRadius: 10,
    padding: 20,
  },
  cardLabel: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  inputGlyph: {
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.serif,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  button: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  note: {
    marginTop: 16,
    fontFamily: FONTS.serif,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
