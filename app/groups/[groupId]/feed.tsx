import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Tree } from '../../../components/pixel/Tree';
import { COLORS, FONTS, HARD_SHADOW } from '../../../components/theme';
import {
  getGroupFeed,
  getGroupMembersWithCheckinCounts,
  getSignedPhotoUrl,
  type CheckinWithProfile,
} from '../../../lib/checkins';
import { getErrorMessage } from '../../../lib/error-message';
import { useGroup } from '../../../lib/group-context';
import { getTreeStage, getTreeStageLabel } from '../../../lib/tree';

export default function GroupFeedScreen() {
  const { group } = useGroup();
  const [feed, setFeed] = useState<CheckinWithProfile[] | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [checkinCounts, setCheckinCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!group) return;
    try {
      const [items, members] = await Promise.all([
        getGroupFeed(group.id),
        getGroupMembersWithCheckinCounts(group.id),
      ]);
      setFeed(items);
      setCheckinCounts(Object.fromEntries(members.map((member) => [member.user_id, member.checkin_count])));
      setErrorMessage(null);

      const withPhotos = items.filter((item) => item.photo_path);
      const urlEntries = await Promise.all(
        withPhotos.map(async (item) => [item.id, await getSignedPhotoUrl(item.photo_path!)] as const)
      );
      const urlMap: Record<string, string> = {};
      for (const [id, url] of urlEntries) {
        if (url) urlMap[id] = url;
      }
      setPhotoUrls(urlMap);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, [group]);

  useEffect(() => {
    load();
  }, [load]);

  if (!group || (feed === null && !errorMessage)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
        <Text style={styles.subtitle}>Small steps, shared together.</Text>
      </View>
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
      <FlatList
        data={feed ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>No check-ins yet. Be the first to read today's chapter.</Text>}
        renderItem={({ item }) => {
          const stage = getTreeStage(checkinCounts[item.user_id] ?? 0);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.treeBadge}>
                  <Tree stage={stage} pixelSize={1.6} />
                </View>
                <View style={styles.nameColumn}>
                  <Text style={styles.name}>{item.profiles?.display_name ?? 'Someone'}</Text>
                  <Text style={styles.chapter}>
                    Read {item.book} {item.chapter} <Text style={styles.stageLabel}>· {getTreeStageLabel(stage)}</Text>
                  </Text>
                </View>
                <View style={styles.readCheck}>
                  <Text style={styles.readCheckGlyph}>✓</Text>
                </View>
              </View>
              {item.photo_path && photoUrls[item.id] && (
                <Image source={{ uri: photoUrls[item.id] }} style={styles.photo} />
              )}
              {item.reflection && <Text style={styles.reflection}>"{item.reflection}"</Text>}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: FONTS.serif,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  error: {
    color: COLORS.error,
    marginBottom: 8,
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  empty: {
    textAlign: 'center',
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
    marginTop: 40,
  },
  card: {
    ...HARD_SHADOW,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.white,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  treeBadge: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.sky,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  nameColumn: {
    flex: 1,
  },
  name: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  stageLabel: {
    color: COLORS.textMuted,
  },
  chapter: {
    marginTop: 2,
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  readCheck: {
    width: 25,
    height: 25,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readCheckGlyph: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  reflection: {
    fontFamily: FONTS.serifItalic,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
});
