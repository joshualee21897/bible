import { Tabs, router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { GroupProvider, useGroup } from '../../../lib/group-context';

function GroupTabs() {
  const { group } = useGroup();

  return (
    <Tabs
      screenOptions={{
        headerTitle: group?.name ?? 'Group',
        headerLeft: () => (
          <Pressable onPress={() => router.replace('/')} hitSlop={8} style={{ paddingHorizontal: 12 }}>
            <Text style={{ color: '#5B9BD5', fontWeight: '600' }}>Groups</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="garden" options={{ title: 'Garden' }} />
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
