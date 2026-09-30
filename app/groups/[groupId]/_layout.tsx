import { Tabs, router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { COLORS } from '../../../components/theme';
import { GroupProvider, useGroup } from '../../../lib/group-context';

function GroupTabs() {
  const { group } = useGroup();

  return (
    <Tabs
      screenOptions={{
        headerTitle: group?.name ?? 'Group',
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
