import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { showAlert } from '../lib/alert';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { buttonBase, COLORS } from '../components/theme';

export default function SignInScreen() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (loading) {
    return (
      <View style={styles.container}>
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
      showAlert('Something went wrong', error instanceof Error ? error.message : String(error));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>We sent a sign-in link to {email}. Open it on this device to continue.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flock</Text>
      <Text style={styles.body}>Enter your email and we&apos;ll send you a link to sign in.</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Pressable style={styles.button} onPress={handleSendLink} disabled={sending}>
        <Text style={styles.buttonText}>{sending ? 'Sending…' : 'Send sign-in link'}</Text>
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
