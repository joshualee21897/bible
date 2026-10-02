import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Tree } from '../pixel/Tree';
import { COLORS, FONTS, HARD_SHADOW } from '../theme';
import {
  getGroupFeed,
  getGroupMembersWithCheckinCounts,
  getSignedPhotoUrl,
  type CheckinWithProfile,
} from '../../lib/checkins';
import { getErrorMessage } from '../../lib/error-message';
import { addReaction, getReactionsFor, removeReaction } from '../../lib/reactions';
import { timeAgo } from '../../lib/time-ago';
import { getTreeStage, getTreeStageLabel } from '../../lib/tree';

export function ReflectionsTab({ groupId }: { groupId: string }) {
  const [feed, setFeed] = useState<CheckinWithProfile[] | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [checkinCounts, setCheckinCounts] = useState<Record<string, number>>({});
  const [amenCounts, setAmenCounts] = useState<Record<string, number>>({});
  const [myAmens, setMyAmens] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [items, members] = await Promise.all([
        getGroupFeed(groupId),
        getGroupMembersWithCheckinCounts(groupId),
      ]);
      setFeed(items);
      setCheckinCounts(Object.fromEntries(members.map((member) => [member.user_id, member.checkin_count])));
      setErrorMessage(null);

      const withPhotos = items.filter((item) => item.photo_path);
      const [urlEntries, reactions] = await Promise.all([
        Promise.all(withPhotos.map(async (item) => [item.id, await getSignedPhotoUrl(item.photo_path!)] as const)),
        getReactionsFor(
          'checkin',
          items.map((item) => item.id)
        ),
      ]);
      const urlMap: Record<string, string> = {};
      for (const [id, url] of urlEntries) {
        if (url) urlMap[id] = url;
      }
      setPhotoUrls(urlMap);
      setAmenCounts(reactions.counts);
      setMyAmens(reactions.mine);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleAmen(checkinId: string) {
    const alreadyAmened = myAmens.has(checkinId);

    setMyAmens((prev) => {
      const next = new Set(prev);
      if (alreadyAmened) next.delete(checkinId);
      else next.add(checkinId);
      return next;
    });
    setAmenCounts((prev) => ({ ...prev, [checkinId]: (prev[checkinId] ?? 0) + (alreadyAmened ? -1 : 1) }));

    try {
      if (alreadyAmened) {
        await removeReaction('checkin', checkinId);
      } else {
        await addReaction('checkin', checkinId);
      }
    } catch {
      // Roll back on failure.
      setMyAmens((prev) => {
        const next = new Set(prev);
        if (alreadyAmened) next.add(checkinId);
        else next.delete(checkinId);
        return next;
      });
      setAmenCounts((prev) => ({ ...prev, [checkinId]: (prev[checkinId] ?? 0) + (alreadyAmened ? 1 : -1) }));
    }
  }

  if (feed === null && !errorMessage) {
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
          const amened = myAmens.has(item.id);
          const amenCount = amenCounts[item.id] ?? 0;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.treeBadge}>
                  <Tree stage={stage} pixelSize={1.6} />
                </View>
                <View style={styles.nameColumn}>
                  <Text style={styles.name}>{item.profiles?.display_name ?? 'Someone'}</Text>
                  <Text style={styles.chapter}>
                    Read {item.book} {item.chapter} <Text style={styles.stageLabel}>· {timeAgo(item.created_at)}</Text>
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
              <Pressable
                style={[styles.amenButton, amened && styles.amenButtonActive]}
                onPress={() => toggleAmen(item.id)}
              >
                <Text style={[styles.amenText, amened && styles.amenTextActive]}>
                  🙏 Amen{amenCount > 0 ? ` · ${amenCount}` : ''}
                </Text>
              </Pressable>
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
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
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
  amenButton: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  amenButtonActive: {
    backgroundColor: COLORS.sage,
  },
  amenText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  amenTextActive: {
    fontFamily: FONTS.headingSemiBold,
  },
});
