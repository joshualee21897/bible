import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GardenItemSprite } from '../../../components/pixel/GardenItemSprite';
import { Lamb } from '../../../components/pixel/Lamb';
import { ProgressBar } from '../../../components/pixel/ProgressBar';
import { Tree } from '../../../components/pixel/Tree';
import { buttonBase, COLORS, FONTS, HARD_SHADOW } from '../../../components/theme';
import { confirmAction, showAlert } from '../../../lib/alert';
import { getChapterCount } from '../../../lib/bible-books';
import { useAuth } from '../../../lib/auth-context';
import { getCurrentChapterNumber, getGroupMembersWithCheckinCounts, getMyCheckedChapters, type MemberWithStats } from '../../../lib/checkins';
import { getDropsSummary, getOwnedItemKeys, type DropsSummary } from '../../../lib/drops';
import { getErrorMessage } from '../../../lib/error-message';
import { getGardenItem } from '../../../lib/garden-items';
import { leaveGroup } from '../../../lib/groups';
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
      setErrorMessage(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, [group]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLeaveGroup() {
    if (!group) return;
    const confirmed = await confirmAction(
      `Leave ${group.name}? You'll need a new invite code to rejoin.`,
      'Leave'
    );
    if (!confirmed) return;

    try {
      await leaveGroup(group.id);
      router.replace('/groups');
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    }
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (errorMessage && (members === null || !drops || !weeklyGoal)) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMessage}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (members === null || !drops || !weeklyGoal) {
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

      <View style={styles.headerCard}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Our garden</Text>
            <Text style={styles.subtitle}>{group.name}</Text>
          </View>
          <View style={styles.balanceBadge}>
            <Text style={styles.balance}>💧 {drops.balance}</Text>
          </View>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalCardTop}>
            <Text style={styles.goalLabel}>This week</Text>
            <Text style={styles.goalValue}>
              {weeklyGoal.daysRead} / {weeklyGoal.combinedTarget} reads
            </Text>
          </View>
          <ProgressBar percent={weeklyGoal.percent} />
        </View>
      </View>

      {weeklyGoal.meetsHarvestThreshold && (
        <View style={styles.harvestCard}>
          <Text style={styles.harvestTitle}>🌾 Our garden bore fruit this week!</Text>
          <Text style={styles.harvestBody}>Time for a Harvest Supper — meet up and share what you've read.</Text>
        </View>
      )}

      <View style={styles.scene}>
        <View style={styles.sceneSky} />
        <View style={styles.sceneGrass} />
        <View style={[styles.cloud, styles.cloudOne]} />
        <View style={[styles.cloud, styles.cloudTwo]} />
        <View style={styles.sun} />
        <View style={styles.flowerOne}>
          <Text style={styles.flowerGlyph}>✦</Text>
        </View>
        <View style={styles.flowerTwo}>
          <Text style={styles.flowerGlyph}>✦</Text>
        </View>

        <View style={styles.lambRow}>
          <Lamb mood={lambMood} pixelSize={3} />
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
                <Tree stage={stage} resting={resting} pixelSize={3} />
                <Text style={styles.memberName}>{member.display_name}</Text>
                <Text style={styles.stageLabel}>{resting ? 'Resting' : getTreeStageLabel(stage)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.caption}>
        <Text style={styles.captionGlyph}>♧</Text>
        <Text style={styles.captionBody}>
          Our garden grows with every chapter.{'\n'}Resting trees are always welcome here.
        </Text>
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

      <Pressable style={styles.shopButton} onPress={() => router.push(`/groups/${group.id}/shop`)}>
        <Text style={styles.shopButtonText}>▤ Visit the shop</Text>
      </Pressable>

      <Pressable onPress={handleLeaveGroup}>
        <Text style={styles.leaveLink}>Leave group</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORS.sky,
    flexGrow: 1,
    gap: 14,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.sky,
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
  headerCard: {
    ...buttonBase,
    width: '100%',
    backgroundColor: COLORS.white,
    padding: 14,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  balanceBadge: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.water,
    paddingVertical: 6,
    paddingHorizontal: 10,
    ...HARD_SHADOW,
  },
  balance: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  shopButton: {
    ...buttonBase,
    width: '100%',
    backgroundColor: COLORS.pink,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shopButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  goalCard: {
    width: '100%',
    gap: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    backgroundColor: COLORS.cream,
  },
  goalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  goalLabel: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  goalValue: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  harvestCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    gap: 4,
    ...HARD_SHADOW,
  },
  harvestTitle: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  harvestBody: {
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
  },
  scene: {
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 12,
    minHeight: 260,
    ...HARD_SHADOW,
  },
  sceneSky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: COLORS.sky,
  },
  sceneGrass: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: COLORS.grass,
  },
  cloud: {
    position: 'absolute',
    width: 40,
    height: 13,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  cloudOne: {
    top: 16,
    left: 20,
  },
  cloudTwo: {
    top: 34,
    right: 24,
    width: 28,
    height: 10,
  },
  sun: {
    position: 'absolute',
    top: 14,
    right: 70,
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.yellow,
  },
  flowerOne: {
    position: 'absolute',
    right: 30,
    bottom: 22,
  },
  flowerTwo: {
    position: 'absolute',
    left: 40,
    bottom: 34,
  },
  flowerGlyph: {
    fontSize: 16,
    color: '#D77F86',
  },
  lambRow: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  lambCaption: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  grove: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  treeSlot: {
    alignItems: 'center',
    width: 90,
  },
  memberName: {
    marginTop: 4,
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  stageLabel: {
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 8,
  },
  captionGlyph: {
    fontFamily: FONTS.heading,
    color: COLORS.sageDark,
  },
  captionBody: {
    flex: 1,
    fontFamily: FONTS.serif,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    textAlign: 'center',
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
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  leaveLink: {
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
    marginTop: 4,
    marginBottom: 12,
  },
});
