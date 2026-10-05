import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Tree } from '../pixel/Tree';
import { COLORS, FONTS, HARD_SHADOW } from '../theme';
import { getGroupFeed, getGroupMembersWithCheckinCounts, type CheckinWithProfile } from '../../lib/checkins';
import { getErrorMessage } from '../../lib/error-message';
import { GARDEN_LEVELS } from '../../lib/garden-levels';
import { useLambMessage } from '../../lib/lamb-overlay-context';
import { addReaction, getReactionsFor, removeReaction } from '../../lib/reactions';
import { getLevelEvents, type LevelEvent } from '../../lib/storehouse';
import { timeAgo } from '../../lib/time-ago';
import { getTreeStage, getTreeStageLabel } from '../../lib/tree';

type FeedRow =
  | { kind: 'checkin'; at: string; checkin: CheckinWithProfile }
  | { kind: 'level'; at: string; event: LevelEvent };

export function ReflectionsTab({ groupId }: { groupId: string }) {
  const [rows, setRows] = useState<FeedRow[] | null>(null);
  const [checkinCounts, setCheckinCounts] = useState<Record<string, number>>({});
  const [amenCounts, setAmenCounts] = useState<Record<string, number>>({});
  const [myAmens, setMyAmens] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useLambMessage({
    id: 'feed-reflections',
    message: "See what everyone's learning. Tap Amen to agree.",
    pose: 'happy',
  });

  const load = useCallback(async () => {
    try {
      const [items, members, levelEvents] = await Promise.all([
        getGroupFeed(groupId),
        getGroupMembersWithCheckinCounts(groupId),
        getLevelEvents(groupId),
      ]);
      const merged: FeedRow[] = [
        ...items.map((checkin): FeedRow => ({ kind: 'checkin', at: checkin.created_at, checkin })),
        ...levelEvents.map((event): FeedRow => ({ kind: 'level', at: event.reached_at, event })),
      ].sort((a, b) => b.at.localeCompare(a.at));
      setRows(merged);
      setCheckinCounts(Object.fromEntries(members.map((member) => [member.user_id, member.checkin_count])));
      setErrorMessage(null);

      const reactions = await getReactionsFor(
        'checkin',
        items.map((item) => item.id)
      );
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

  if (rows === null && !errorMessage) {
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
        data={rows ?? []}
        keyExtractor={(row) => (row.kind === 'checkin' ? row.checkin.id : `level-${row.event.id}`)}
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
        renderItem={({ item: row }) => {
          if (row.kind === 'level') {
            const level = GARDEN_LEVELS[row.event.level_index];
            return (
              <View style={styles.levelCard}>
                <Text style={styles.levelCardText}>
                  🌿 Our garden became a {level?.name ?? 'new level'}! <Text style={styles.stageLabel}>· {timeAgo(row.event.reached_at)}</Text>
                </Text>
              </View>
            );
          }

          const item = row.checkin;
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
  levelCard: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
  },
  levelCardText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
    textAlign: 'center',
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
