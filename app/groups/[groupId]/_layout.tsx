import { Tabs, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { buttonBase, COLORS } from '../../../components/theme';
import { GroupProvider, useGroup } from '../../../lib/group-context';

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
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textPrimary,
        headerLeft: () => (
          <Pressable onPress={() => router.replace('/')} hitSlop={8} style={{ paddingHorizontal: 12 }}>
            <Text style={{ color: COLORS.accentText, fontWeight: '600' }}>Groups</Text>
          </Pressable>
        ),
        tabBarStyle: { backgroundColor: COLORS.surface },
        tabBarActiveTintColor: COLORS.accentText,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="garden" options={{ title: 'Garden' }} />
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
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: COLORS.primaryText,
    fontWeight: 'bold',
  },
  backLink: {
    color: COLORS.accentText,
    fontWeight: '600',
  },
});
