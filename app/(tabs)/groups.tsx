import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { LambGuide } from '../../components/guide/LambGuide';
import { ProgressBar } from '../../components/pixel/ProgressBar';
import { Tree } from '../../components/pixel/Tree';
import { buttonBase, COLORS, FONTS } from '../../components/theme';
import { getChapterCount } from '../../lib/bible-books';
import { getCurrentChapterNumber } from '../../lib/checkins';
import { getErrorMessage } from '../../lib/error-message';
import { listMyGroups, type MyGroup } from '../../lib/groups';
import { getWeeklyGoalSummary, type WeeklyGoalSummary } from '../../lib/weekly-goal';

type GroupRow = MyGroup & { summary: WeeklyGoalSummary; todayChapter: number; maxChapter: number };

export default function MyGroupsScreen() {
  const [groups, setGroups] = useState<GroupRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const myGroups = await listMyGroups();
      const rows = await Promise.all(
        myGroups.map(async (group) => {
          const maxChapter = getChapterCount(group.book);
          const todayChapter = getCurrentChapterNumber(group.start_date, maxChapter);
          const summary = await getWeeklyGoalSummary(group.id, group.weekly_target);
          return { ...group, summary, todayChapter, maxChapter };
        })
      );
      setGroups(rows);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My groups</Text>
          <Text style={styles.subtitle}>Read and grow with people you love.</Text>
        </View>
        <Pressable style={styles.avatarButton} onPress={() => router.push('/profile')}>
          <Text style={styles.avatarButtonText}>Me</Text>
        </Pressable>
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      {groups && groups.length > 0 && (
        <LambGuide
          id="groups-list"
          message={[
            'Tap a group to read, share, and grow together.',
            'Every group has its own little garden waiting.',
            "Pick a group below to see today's chapter.",
          ]}
          pose="pointing"
          style={styles.lambGuide}
        />
      )}

      <FlatList
        data={groups ?? []}
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
        ListEmptyComponent={
          groups === null ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.empty}>You're not in any groups yet. Create one or join with an invite code.</Text>
          )
        }
        renderItem={({ item, index }) => (
          <Pressable
            style={[styles.groupCard, index % 2 === 1 && styles.groupCardAlt]}
            onPress={() => router.push(`/groups/${item.id}`)}
          >
            <View style={styles.groupCardTop}>
              <View style={styles.groupSprite}>
                <Tree stage={index % 2 === 1 ? 'sapling' : 'tree'} pixelSize={1.4} />
              </View>
              <View style={styles.groupCardInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupBook}>
                  Reading {item.book} · Day {item.todayChapter} of {item.maxChapter}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
            <View style={styles.groupMeta}>
              <Text style={styles.groupMetaText}>•• {item.summary.memberCount} members</Text>
              <Text style={styles.groupMetaText}>Weekly goal</Text>
            </View>
            <ProgressBar percent={item.summary.percent} />
          </Pressable>
        )}
      />

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={() => router.push('/create-group')}>
          <Text style={styles.buttonText}>+ Create group</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={() => router.push('/join-group')}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>•• Join with code</Text>
        </Pressable>
      </View>

      <View style={styles.gentleNote}>
        <Text style={styles.gentleNoteGlyph}>♧</Text>
        <Text style={styles.gentleNoteBody}>
          <Text style={styles.gentleNoteStrong}>Grow at your own pace.{'\n'}</Text>
          Every chapter is a little water for the garden.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lambGuide: {
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: FONTS.serif,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  avatarButton: {
    ...buttonBase,
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  error: {
    color: COLORS.error,
    marginBottom: 8,
  },
  list: {
    flexGrow: 1,
    gap: 14,
    paddingBottom: 16,
  },
  empty: {
    textAlign: 'center',
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
    marginTop: 40,
  },
  groupCard: {
    ...buttonBase,
    padding: 14,
    backgroundColor: '#F5FBF2',
  },
  groupCardAlt: {
    backgroundColor: '#FAF7FF',
  },
  groupCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupSprite: {
    width: 48,
    height: 50,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.sky,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  groupCardInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  groupBook: {
    marginTop: 3,
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chevron: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.textMuted,
  },
  groupMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  groupMetaText: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 16,
  },
  button: {
    ...buttonBase,
    flex: 1,
    backgroundColor: COLORS.sage,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: COLORS.cream,
  },
  buttonText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  buttonTextSecondary: {
    color: COLORS.textPrimary,
  },
  gentleNote: {
    marginTop: 16,
    marginBottom: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.sageDark,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#EDF8E9',
  },
  gentleNoteGlyph: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.sageDark,
  },
  gentleNoteBody: {
    flex: 1,
    fontFamily: FONTS.serif,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  gentleNoteStrong: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
});
