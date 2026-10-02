import { Redirect, Tabs, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS, HARD_SHADOW, buttonBase } from '../../../components/theme';
import { useAuth } from '../../../lib/auth-context';
import { GroupProvider, useGroup } from '../../../lib/group-context';

const SEGMENTS = [
  { name: 'bible', label: 'Bible' },
  { name: 'feed', label: 'Feed' },
  { name: 'garden', label: 'Garden' },
];

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/groups');
  }
}

function GroupHeader({ title, routeName }: { title: string; routeName: string }) {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const showSegments = SEGMENTS.some((segment) => segment.name === routeName);

  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.backButton}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backButton} />
      </View>
      {showSegments && (
        <View style={styles.segmentRow}>
          {SEGMENTS.map((segment) => {
            const isActive = segment.name === routeName;
            return (
              <Pressable
                key={segment.name}
                style={[styles.segment, isActive && styles.segmentActive]}
                onPress={() => router.replace(`/groups/${groupId}/${segment.name}` as never)}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{segment.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

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
        <Pressable onPress={() => router.replace('/groups')}>
          <Text style={styles.backLink}>Back to My Groups</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Tabs
      tabBar={() => null}
      screenOptions={({ route }) => ({
        header: () => <GroupHeader title={route.name === 'shop' ? 'Shop' : group.name} routeName={route.name} />,
      })}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="bible" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="garden" />
      <Tabs.Screen name="shop" options={{ href: null }} />
    </Tabs>
  );
}

export default function GroupLayout() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

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
  headerWrap: {
    backgroundColor: COLORS.cream,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    paddingTop: 54,
    paddingBottom: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: {
    fontSize: 24,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.headingSemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  segmentRow: {
    ...HARD_SHADOW,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: COLORS.sage,
  },
  segmentText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    color: COLORS.textPrimary,
  },
});
