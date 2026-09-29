import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GardenItemSprite } from '../../../components/pixel/GardenItemSprite';
import { Lamb } from '../../../components/pixel/Lamb';
import { ProgressBar } from '../../../components/pixel/ProgressBar';
import { Tree } from '../../../components/pixel/Tree';
import { getChapterCount } from '../../../lib/bible-books';
import { useAuth } from '../../../lib/auth-context';
import { getCurrentChapterNumber, getGroupMembersWithCheckinCounts, getMyCheckedChapters, type MemberWithStats } from '../../../lib/checkins';
import { getDropsSummary, getOwnedItemKeys, type DropsSummary } from '../../../lib/drops';
import { getGardenItem } from '../../../lib/garden-items';
import { useGroup } from '../../../lib/group-context';
import { getLambMood } from '../../../lib/lamb-mood';
import { getTreeStage, getTreeStageLabel, isTreeResting } from '../../../lib/tree';
import { getWeeklyGoalSummary, type WeeklyGoalSummary } from '../../../lib/weekly-goal';

export default function GroupGardenScreen() {
  const { group } = useGroup();
  const { session } = useAuth();

  const [members, setMembers] = useState<MemberWithStats[] | null>(null);
  const [drops, setDrops] = useState<DropsSummary | null>(null);
  const [ownedItemKeys, setOwnedItemKeys] = useState<string[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoalSummary | null>(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!group) return;
    try {
      const maxChapter = getChapterCount(group.book);
      const todayChapter = getCurrentChapterNumber(group.start_date, maxChapter);

      const [stats, dropsSummary, owned, goalSummary, checkedChapters] = await Promise.all([
        getGroupMembersWithCheckinCounts(group.id),
        getDropsSummary(group.id),
        getOwnedItemKeys(group.id),
        getWeeklyGoalSummary(group.id, group.weekly_target),
        getMyCheckedChapters(group.id, group.book),
      ]);

      setMembers(stats);
      setDrops(dropsSummary);
      setOwnedItemKeys([...owned]);
      setWeeklyGoal(goalSummary);
      setHasCheckedInToday(checkedChapters.has(todayChapter));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  }, [group]);

  useEffect(() => {
    load();
  }, [load]);

  if (!group || members === null || !drops || !weeklyGoal) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const lambMood = getLambMood(hasCheckedInToday);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <View style={styles.topRow}>
        <Text style={styles.balance}>💧 {drops.balance} drops</Text>
        <Pressable style={styles.shopButton} onPress={() => router.push(`/groups/${group.id}/shop`)}>
          <Text style={styles.shopButtonText}>Shop</Text>
        </Pressable>
      </View>

      <View style={styles.goalCard}>
        <Text style={styles.goalLabel}>
          This week: {weeklyGoal.daysRead} of {weeklyGoal.combinedTarget} reading-days
        </Text>
        <ProgressBar percent={weeklyGoal.percent} />
      </View>

      {weeklyGoal.meetsHarvestThreshold && (
        <View style={styles.harvestCard}>
          <Text style={styles.harvestTitle}>🌾 Our garden bore fruit this week!</Text>
          <Text style={styles.harvestBody}>Time for a Harvest Supper — meet up and share what you've read.</Text>
        </View>
      )}

      <View style={styles.lambRow}>
        <Lamb mood={lambMood} pixelSize={5} />
        <Text style={styles.lambCaption}>
          {lambMood === 'sleeping' && 'The lamb is asleep.'}
          {lambMood === 'waiting' && 'The lamb is waiting by your tree.'}
          {lambMood === 'happy' && 'The lamb is happy to see our garden.'}
        </Text>
      </View>

      <View style={styles.grove}>
        {members.map((member) => {
          const stage = getTreeStage(member.checkin_count);
          const resting = isTreeResting(member.last_checkin_at, member.checkin_count);
          return (
            <View key={member.user_id} style={styles.treeSlot}>
              <Tree stage={stage} resting={resting} pixelSize={4} />
              <Text style={styles.memberName}>{member.display_name}</Text>
              <Text style={styles.stageLabel}>{resting ? 'Resting' : getTreeStageLabel(stage)}</Text>
            </View>
          );
        })}
      </View>

      {ownedItemKeys.length > 0 && (
        <View style={styles.itemsRow}>
          {ownedItemKeys.map((key) => (
            <View key={key} style={styles.itemSlot}>
              <GardenItemSprite itemKey={key} pixelSize={3} />
              <Text style={styles.itemName}>{getGardenItem(key)?.name ?? key}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#DFF0FF',
    flexGrow: 1,
    gap: 14,
  },
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#C8403A',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  balance: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shopButton: {
    backgroundColor: '#111',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  goalCard: {
    width: '100%',
    gap: 6,
  },
  goalLabel: {
    fontWeight: '600',
  },
  harvestCard: {
    width: '100%',
    backgroundColor: '#F7F3E8',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  harvestTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  harvestBody: {
    color: '#444',
  },
  lambRow: {
    alignItems: 'center',
    gap: 4,
  },
  lambCaption: {
    color: '#444',
  },
  grove: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  treeSlot: {
    alignItems: 'center',
    width: 140,
  },
  memberName: {
    marginTop: 6,
    fontWeight: 'bold',
  },
  stageLabel: {
    color: '#555',
    fontSize: 12,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  itemSlot: {
    alignItems: 'center',
    width: 100,
  },
  itemName: {
    marginTop: 4,
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
  },
});
