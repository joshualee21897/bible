import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { buttonBase, COLORS, FONTS } from '../../components/theme';
import { useAuth } from '../../lib/auth-context';
import { getErrorMessage } from '../../lib/error-message';
import { getMyProfile } from '../../lib/profile';

function TabIcon({ glyph, focused, color }: { glyph: string; focused: boolean; color: string }) {
  return (
    <View style={[styles.iconBox, focused && { backgroundColor: color, borderColor: COLORS.border }]}>
      <Text style={[styles.glyph, focused && styles.glyphFocused]}>{glyph}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!session) {
      setCheckingProfile(false);
      return;
    }
    setCheckingProfile(true);
    getMyProfile()
      .then((profile) => {
        setNeedsProfile(!profile);
        setErrorMessage(null);
      })
      .catch((error) => setErrorMessage(getErrorMessage(error)))
      .finally(() => setCheckingProfile(false));
  }, [session, retryKey]);

  if (loading || (session && checkingProfile)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (errorMessage) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMessage}</Text>
        <Pressable style={styles.retryButton} onPress={() => setRetryKey((key) => key + 1)}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (needsProfile) {
    return <Redirect href="/setup-profile" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon glyph="⌂" focused={focused} color={COLORS.sage} />,
        }}
      />
      <Tabs.Screen
        name="read"
        options={{
          title: 'Read',
          tabBarIcon: ({ focused }) => <TabIcon glyph="▤" focused={focused} color={COLORS.water} />,
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'Missions',
          tabBarIcon: ({ focused }) => <TabIcon glyph="✦" focused={focused} color={COLORS.yellow} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ focused }) => <TabIcon glyph="••" focused={focused} color={COLORS.lavender} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  error: {
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#EDE6DA',
    height: 66,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: FONTS.headingMedium,
    fontSize: 11,
    marginTop: 2,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  glyphFocused: {
    color: COLORS.textPrimary,
  },
});
