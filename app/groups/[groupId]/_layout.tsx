import { Tabs, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { buttonBase, COLORS, FONTS } from '../../../components/theme';
import { GroupProvider, useGroup } from '../../../lib/group-context';

function TabIcon({ glyph, tint, focused }: { glyph: string; tint: string; focused: boolean }) {
  return (
    <View style={[tabIconStyles.box, { backgroundColor: tint }, focused && tabIconStyles.boxFocused]}>
      <Text style={tabIconStyles.glyph}>{glyph}</Text>
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  box: {
    width: 34,
    height: 30,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: COLORS.border,
  },
  glyph: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
});

function GroupTabs() {
  const { group, loading, error, refresh } = useGroup();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Could not load this group.'}</Text>
        <Pressable style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.backLink}>Back to My Groups</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerTitle: group.name,
        headerTitleStyle: { fontFamily: FONTS.headingSemiBold },
        headerStyle: { backgroundColor: COLORS.cream },
        headerTintColor: COLORS.textPrimary,
        headerLeft: () => (
          <Pressable onPress={() => router.replace('/')} hitSlop={8} style={{ paddingHorizontal: 12 }}>
            <Text style={{ color: COLORS.textPrimary, fontFamily: FONTS.headingSemiBold }}>Groups</Text>
          </Pressable>
        ),
        tabBarStyle: { backgroundColor: COLORS.cream, borderTopWidth: 2, borderTopColor: COLORS.border, height: 68 },
        tabBarLabelStyle: { fontFamily: FONTS.headingMedium, fontSize: 11 },
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon glyph="▥" tint={COLORS.yellow} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabIcon glyph="≡" tint={COLORS.pink} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: 'Garden',
          tabBarIcon: ({ focused }) => <TabIcon glyph="♧" tint={COLORS.sage} focused={focused} />,
        }}
      />
      <Tabs.Screen name="shop" options={{ href: null, title: 'Shop' }} />
    </Tabs>
  );
}

export default function GroupLayout() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  return (
    <GroupProvider groupId={groupId}>
      <GroupTabs />
    </GroupProvider>
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
  backLink: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
});
