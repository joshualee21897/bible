import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../../components/theme';
import { getGroupFeed, getSignedPhotoUrl, type CheckinWithProfile } from '../../../lib/checkins';
import { useGroup } from '../../../lib/group-context';

export default function GroupFeedScreen() {
  const { group } = useGroup();
  const [feed, setFeed] = useState<CheckinWithProfile[] | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!group) return;
    try {
      const items = await getGroupFeed(group.id);
      setFeed(items);
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
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  }, [group]);

  useEffect(() => {
    load();
  }, [load]);

  if (!group || feed === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
      <FlatList
        data={feed}
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.avatarDot, { backgroundColor: item.profiles?.avatar_color ?? COLORS.textMuted }]} />
              <Text style={styles.name}>{item.profiles?.display_name ?? 'Someone'}</Text>
              <Text style={styles.chapter}>
                {item.book} {item.chapter}
              </Text>
            </View>
            {item.reflection && <Text style={styles.reflection}>{item.reflection}</Text>}
            {item.photo_path && photoUrls[item.id] && (
              <Image source={{ uri: photoUrls[item.id] }} style={styles.photo} />
            )}
          </View>
        )}
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
    color: COLORS.textMuted,
    marginTop: 40,
  },
  card: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  name: {
    fontWeight: 'bold',
    flex: 1,
    color: COLORS.textPrimary,
  },
  chapter: {
    color: COLORS.textMuted,
  },
  reflection: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
  },
});
