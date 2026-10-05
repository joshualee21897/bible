import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { InfoSheet } from '../../../components/garden/InfoSheet';
import { LambGuide } from '../../../components/guide/LambGuide';
import { buildFlatFence, buildFlatGround } from '../../../components/pixel/flat-ground';
import { GardenItemSprite } from '../../../components/pixel/GardenItemSprite';
import { Lamb } from '../../../components/pixel/Lamb';
import { PixelGrid } from '../../../components/pixel/PixelGrid';
import { ProgressBar } from '../../../components/pixel/ProgressBar';
import { Tree } from '../../../components/pixel/Tree';
import { buttonBase, COLORS, FONTS, HARD_SHADOW } from '../../../components/theme';
import { PALETTE } from '../../../components/pixel/palette';
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

const PIXEL_SIZE = 3;
const COLUMNS = 3;
const SKY_HEIGHT = 70;
const GROUND_BAND_HEIGHT = 32;
const FENCE_HEIGHT = 24;

type SheetKind = 'balance' | 'invite' | 'week' | null;

export default function GroupGardenScreen() {
  const { group } = useGroup();
  const { session } = useAuth();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [members, setMembers] = useState<MemberWithStats[] | null>(null);
  const [drops, setDrops] = useState<DropsSummary | null>(null);
  const [ownedItemKeys, setOwnedItemKeys] = useState<string[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoalSummary | null>(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState<SheetKind>(null);

  const sceneHeight = Math.round(windowHeight * 0.75);
  const sceneWidth = windowWidth - 32;
  const groundGrid = useMemo(
    () => buildFlatGround(Math.round(sceneWidth / (GROUND_BAND_HEIGHT / 14))),
    [sceneWidth]
  );
  const fenceGrid = useMemo(
    () => buildFlatFence(Math.round(sceneWidth / (FENCE_HEIGHT / 20))),
    [sceneWidth]
  );

  const load = useCallback(async () => {
    if (!group) return;
    try {
      const maxChapter = getChapterCount(group.book);
      const todayChapter = getCurrentChapterNumber(group.start_date, maxChapter);

      const [stats, dropsSummary, owned, goalSummary, checkedChapters] = await Promise.all([
        getGroupMembersWithCheckinCounts(group.id),
        getDropsSummary(),
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

  async function handleShareInvite() {
    if (!group) return;
    try {
      await Share.share({
        message: `Join our Bible reading group "${group.name}" on Sprout! Use invite code ${group.invite_code} in the app.`,
      });
    } catch {
      // The user cancelled the share sheet — nothing to do.
    }
  }

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

  // Bought animals and items live up near the sky, fenced off from
  // everyone's trees and the lamb below.
  type Slot =
    | { kind: 'member'; member: MemberWithStats }
    | { kind: 'lamb' }
    | { kind: 'item'; itemKey: string };
  const itemSlots: Slot[] = ownedItemKeys.map((itemKey): Slot => ({ kind: 'item', itemKey }));
  const memberSlots: Slot[] = [
    ...members.map((member): Slot => ({ kind: 'member', member })),
    { kind: 'lamb' },
  ];
  const slots: Slot[] = [...itemSlots, ...memberSlots];

  function renderSlot(slot: Slot) {
    if (slot.kind === 'member') {
      const stage = getTreeStage(slot.member.checkin_count);
      const resting = isTreeResting(slot.member.last_checkin_at, slot.member.checkin_count);
      return (
        <View key={slot.member.user_id} style={styles.gridCell}>
          <Tree stage={stage} resting={resting} pixelSize={PIXEL_SIZE} showGround={false} />
          <View style={styles.labelPill}>
            <Text style={styles.labelName} numberOfLines={1}>
              {slot.member.display_name}
            </Text>
            <Text style={styles.labelStage}>{resting ? 'Resting' : getTreeStageLabel(stage)}</Text>
          </View>
        </View>
      );
    }
    if (slot.kind === 'lamb') {
      return (
        <View key="lamb" style={styles.gridCell}>
          <Lamb mood={lambMood} pixelSize={PIXEL_SIZE} />
          <View style={styles.labelPill}>
            <Text style={styles.labelStage}>
              {lambMood === 'sleeping' && 'Asleep'}
              {lambMood === 'waiting' && 'Waiting for you'}
              {lambMood === 'happy' && 'Happy'}
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View key={slot.itemKey} style={styles.gridCell}>
        <GardenItemSprite itemKey={slot.itemKey} pixelSize={PIXEL_SIZE} />
        <View style={styles.labelPill}>
          <Text style={styles.labelStage} numberOfLines={1}>
            {getGardenItem(slot.itemKey)?.name ?? slot.itemKey}
          </Text>
        </View>
      </View>
    );
  }

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
        <View>
          <Text style={styles.title}>Our garden</Text>
          <Text style={styles.subtitle}>{group.name}</Text>
        </View>
      </View>

      <LambGuide
        id="garden"
        message={[
          'Every chapter waters your tree. Watch our garden grow!',
          'Resting trees are always welcome here.',
          'Our garden grows a little with each check-in.',
        ]}
        pose="happy"
      />

      <View style={[styles.scene, { height: sceneHeight }]}>
        <View style={[styles.sky, { height: SKY_HEIGHT }]} />
        <View style={styles.grassArea}>
          <View style={{ width: sceneWidth }}>
            <PixelGrid grid={groundGrid} pixelSize={GROUND_BAND_HEIGHT / 14} />
          </View>
          <ScrollView
            style={styles.gridScroll}
            showsVerticalScrollIndicator={slots.length > COLUMNS}
            contentContainerStyle={styles.grid}
          >
            {itemSlots.map(renderSlot)}
            {itemSlots.length > 0 && (
              <View style={styles.fenceRow}>
                <PixelGrid grid={fenceGrid} pixelSize={FENCE_HEIGHT / 20} />
              </View>
            )}
            {memberSlots.map(renderSlot)}
          </ScrollView>
        </View>

        {slots.length > COLUMNS && <Text style={styles.scrollHint}>Scroll for more ↓</Text>}
      </View>

      <View style={styles.iconRow}>
        <Pressable style={styles.iconButton} onPress={() => setOpenSheet('balance')}>
          <Text style={styles.iconGlyph}>💧</Text>
          <Text style={styles.iconLabel}>{drops.balance}</Text>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => setOpenSheet('invite')}>
          <Text style={styles.iconGlyph}>🔑</Text>
          <Text style={styles.iconLabel}>Invite</Text>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => setOpenSheet('week')}>
          <Text style={styles.iconGlyph}>📅</Text>
          <Text style={styles.iconLabel}>This week</Text>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={handleLeaveGroup}>
          <Text style={styles.iconGlyph}>🚪</Text>
          <Text style={styles.iconLabel}>Leave</Text>
        </Pressable>
      </View>

      <InfoSheet visible={openSheet === 'balance'} title="Water drops" onClose={() => setOpenSheet(null)}>
        <View style={styles.sheetBalanceRow}>
          <Text style={styles.sheetBalanceText}>💧 {drops.balance}</Text>
          <Text style={styles.sheetBalanceCaption}>yours to spend, across every group</Text>
        </View>
        <Pressable
          style={styles.sheetPrimaryButton}
          onPress={() => {
            setOpenSheet(null);
            router.push(`/groups/${group.id}/shop`);
          }}
        >
          <Text style={styles.sheetPrimaryButtonText}>▤ Visit the shop</Text>
        </Pressable>
      </InfoSheet>

      <InfoSheet visible={openSheet === 'invite'} title="Invite friends" onClose={() => setOpenSheet(null)}>
        <View style={styles.inviteRow}>
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCodeLabel}>Invite code</Text>
            <Text style={styles.inviteCode}>{group.invite_code}</Text>
          </View>
          <Pressable style={styles.inviteShareButton} onPress={handleShareInvite}>
            <Text style={styles.inviteShareButtonText}>Share</Text>
          </Pressable>
        </View>
      </InfoSheet>

      <InfoSheet visible={openSheet === 'week'} title="This week" onClose={() => setOpenSheet(null)}>
        <View style={styles.goalCard}>
          <View style={styles.goalCardTop}>
            <Text style={styles.goalLabel}>Our combined reading</Text>
            <Text style={styles.goalValue}>
              {weeklyGoal.daysRead} / {weeklyGoal.combinedTarget} reads
            </Text>
          </View>
          <ProgressBar percent={weeklyGoal.percent} />
        </View>
        {weeklyGoal.meetsHarvestThreshold && (
          <View style={styles.harvestCard}>
            <Text style={styles.harvestTitle}>🌾 Our garden bore fruit this week!</Text>
            <Text style={styles.harvestBody}>Time for a Harvest Supper — meet up and share what you've read.</Text>
          </View>
        )}
      </InfoSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
    flexGrow: 1,
    gap: 12,
  },
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  scene: {
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.sky,
    position: 'relative',
    ...HARD_SHADOW,
  },
  sky: {
    width: '100%',
    backgroundColor: COLORS.sky,
  },
  grassArea: {
    flex: 1,
    backgroundColor: PALETTE.grassDark,
  },
  gridScroll: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 10,
    paddingBottom: 16,
  },
  gridCell: {
    width: `${100 / COLUMNS}%`,
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  fenceRow: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  scrollHint: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  labelPill: {
    marginTop: 4,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    maxWidth: '100%',
  },
  labelName: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  labelStage: {
    fontFamily: FONTS.serif,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconButton: {
    ...buttonBase,
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  iconGlyph: {
    fontSize: 18,
  },
  iconLabel: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  sheetBalanceRow: {
    alignItems: 'center',
    gap: 2,
  },
  sheetBalanceText: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.textPrimary,
  },
  sheetBalanceCaption: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sheetPrimaryButton: {
    ...buttonBase,
    backgroundColor: COLORS.pink,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetPrimaryButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inviteCodeBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.yellow,
  },
  inviteCodeLabel: {
    fontFamily: FONTS.serif,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  inviteCode: {
    marginTop: 1,
    fontFamily: FONTS.heading,
    fontSize: 18,
    letterSpacing: 3,
    color: COLORS.textPrimary,
  },
  inviteShareButton: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  inviteShareButtonText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  goalCard: {
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
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  harvestTitle: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  harvestBody: {
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
  },
});
