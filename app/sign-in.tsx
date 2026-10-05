import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

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
  const [signingIn, setSigningIn] = useState(false);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/today" />;
  }

  async function handleGoogleSignIn() {
    setSigningIn(true);
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/today` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) {
        showAlert('Something went wrong', error.message);
        setSigningIn(false);
      }
      // On success the browser navigates away to Google, so there's nothing
      // more to do here — we come back through the redirect above.
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
      setSigningIn(false);
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
          <Text style={styles.heroTitle}>Sprout</Text>
          <Text style={styles.heroSubtitle}>The Mustard Seed Bible Reading App</Text>
        </View>
      </View>

      <View style={styles.grass}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Welcome</Text>
          <Pressable style={styles.button} onPress={handleGoogleSignIn} disabled={signingIn}>
            <View style={styles.googleBadge}>
              <Text style={styles.googleBadgeText}>G</Text>
            </View>
            <Text style={styles.buttonText}>{signingIn ? 'Opening Google…' : 'Continue with Google'}</Text>
          </Pressable>
          <Text style={styles.note}>No password to remember. We&apos;ll use your Google account to sign you in.</Text>
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
  button: {
    ...buttonBase,
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  buttonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  googleBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBadgeText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
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
