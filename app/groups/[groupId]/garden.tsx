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
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { InfoSheet } from '../../../components/garden/InfoSheet';
import { LevelUpCelebration } from '../../../components/garden/LevelUpCelebration';
import { LambGuide } from '../../../components/guide/LambGuide';
import { buildFlatFence, buildFlatGround } from '../../../components/pixel/flat-ground';
import { GardenItemSprite } from '../../../components/pixel/GardenItemSprite';
import { getLevelDecorKey, getLevelDecorKeys } from '../../../components/pixel/garden-level-decor';
import { GardenLevelDecorSprite } from '../../../components/pixel/GardenLevelDecorSprite';
import { Lamb } from '../../../components/pixel/Lamb';
import { PixelGrid } from '../../../components/pixel/PixelGrid';
import { ProgressBar } from '../../../components/pixel/ProgressBar';
import { Tree } from '../../../components/pixel/Tree';
import { buttonBase, COLORS, FONTS, HARD_SHADOW } from '../../../components/theme';
import { PALETTE } from '../../../components/pixel/palette';
import { showAlert } from '../../../lib/alert';
import { getChapterCount } from '../../../lib/bible-books';
import { useAuth } from '../../../lib/auth-context';
import { getCurrentChapterNumber, getGroupMembersWithCheckinCounts, getMyCheckedChapters, type MemberWithStats } from '../../../lib/checkins';
import { getDropsSummary, getGroupItems, type DropsSummary } from '../../../lib/drops';
import { getErrorMessage } from '../../../lib/error-message';
import { GARDEN_LEVELS, type GardenLevelDef } from '../../../lib/garden-levels';
import { leaveGroup } from '../../../lib/groups';
import { useGroup } from '../../../lib/group-context';
import { getLambMood } from '../../../lib/lamb-mood';
import { getLastSeenLevel, setLastSeenLevel } from '../../../lib/level-celebration';
import { depositToStorehouse, getStorehouseSummary, recordLevelsReached, type StorehouseSummary } from '../../../lib/storehouse';
import { getTreeStage, getTreeStageLabel, isTreeResting } from '../../../lib/tree';

const PIXEL_SIZE = 3;
const COLUMNS = 3;
const SKY_HEIGHT = 70;
const GROUND_BAND_HEIGHT = 32;
const FENCE_ROWS = 12;
const FENCE_PIXEL_SIZE = 2.4;
const DEPOSIT_QUICK_AMOUNTS = [10, 50, 100];

type SheetKind = 'balance' | 'invite' | 'levels' | 'deposit' | 'leave' | null;

export default function GroupGardenScreen() {
  const { group } = useGroup();
  const { session } = useAuth();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [members, setMembers] = useState<MemberWithStats[] | null>(null);
  const [drops, setDrops] = useState<DropsSummary | null>(null);
  const [ownedItemKeys, setOwnedItemKeys] = useState<string[]>([]);
  const [storehouse, setStorehouse] = useState<StorehouseSummary | null>(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState<SheetKind>(null);
  const [leaveText, setLeaveText] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number | null>(null);
  const [customDepositText, setCustomDepositText] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [celebratingLevel, setCelebratingLevel] = useState<GardenLevelDef | null>(null);

  const sceneHeight = Math.round(windowHeight * 0.75);
  const sceneWidth = windowWidth - 32;
  const groundGrid = useMemo(
    () => buildFlatGround(Math.round(sceneWidth / (GROUND_BAND_HEIGHT / 14))),
    [sceneWidth]
  );
  const fenceGrid = useMemo(
    () => buildFlatFence(Math.round(sceneWidth / FENCE_PIXEL_SIZE), FENCE_ROWS),
    [sceneWidth]
  );

  const load = useCallback(async () => {
    if (!group) return;
    try {
      const maxChapter = getChapterCount(group.book);
      const todayChapter = getCurrentChapterNumber(group.start_date, maxChapter);

      const [stats, dropsSummary, owned, storehouseSummary, checkedChapters] = await Promise.all([
        getGroupMembersWithCheckinCounts(group.id),
        getDropsSummary(),
        getGroupItems(group.id),
        getStorehouseSummary(group.id),
        getMyCheckedChapters(group.id, group.book),
      ]);

      setMembers(stats);
      setDrops(dropsSummary);
      setOwnedItemKeys(owned);
      setStorehouse(storehouseSummary);
      setHasCheckedInToday(checkedChapters.has(todayChapter));
      setErrorMessage(null);

      const currentIndex = storehouseSummary.progress.level.index;
      recordLevelsReached(group.id, currentIndex).catch(() => {
        // Best-effort — worst case the feed banner is posted a little late.
      });
      const lastSeen = getLastSeenLevel(group.id);
      if (currentIndex > lastSeen) {
        setCelebratingLevel(storehouseSummary.progress.level);
      }
      setLastSeenLevel(group.id, currentIndex);
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
    if (leaveText.trim().toLowerCase() !== group.name.trim().toLowerCase()) return;

    setLeaving(true);
    try {
      await leaveGroup(group.id);
      router.replace('/groups');
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
      setLeaving(false);
    }
  }

  async function handleGiveDrops() {
    if (!group || !drops || depositAmount === null) return;
    if (depositAmount <= 0 || depositAmount > drops.balance) return;

    setDepositing(true);
    try {
      await depositToStorehouse(group.id, depositAmount);
      setOpenSheet(null);
      setDepositAmount(null);
      setCustomDepositText('');
      await load();
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setDepositing(false);
    }
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (errorMessage && (members === null || !drops || !storehouse)) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMessage}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (members === null || !drops || !storehouse) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const lambMood = getLambMood(hasCheckedInToday);
  const decorKeys = getLevelDecorKeys(storehouse.progress.level.index);

  // Bought animals and items live up near the sky, fenced off from
  // everyone's trees and the lamb below.
  type Slot =
    | { kind: 'member'; member: MemberWithStats }
    | { kind: 'lamb' }
    | { kind: 'item'; itemKey: string; instanceKey: string };
  // The same item key can appear more than once (several people can each
  // buy their own lion), so each purchase needs its own React key.
  const itemSlots: Slot[] = ownedItemKeys.map((itemKey, index): Slot => ({
    kind: 'item',
    itemKey,
    instanceKey: `${itemKey}-${index}`,
  }));
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
        </View>
      );
    }
    return (
      <View key={slot.instanceKey} style={styles.gridCell}>
        <GardenItemSprite itemKey={slot.itemKey} pixelSize={PIXEL_SIZE} />
      </View>
    );
  }

  const maxGivableAmount = drops.balance;
  const customDepositValue = parseInt(customDepositText, 10);
  const effectiveDepositAmount =
    depositAmount !== null ? depositAmount : Number.isFinite(customDepositValue) ? customDepositValue : null;
  const canGiveDrops =
    effectiveDepositAmount !== null && effectiveDepositAmount > 0 && effectiveDepositAmount <= maxGivableAmount;

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
        <View style={styles.topRowText}>
          <Text style={styles.title}>Our garden</Text>
          <Text style={styles.subtitle}>{group.name}</Text>
        </View>
        <View style={styles.topRowActions}>
          <Pressable style={styles.balanceBadge} onPress={() => setOpenSheet('balance')}>
            <Text style={styles.balanceBadgeText}>💧 {drops.balance}</Text>
          </Pressable>
          <Pressable style={styles.inviteBadge} onPress={() => setOpenSheet('invite')}>
            <Text style={styles.inviteBadgeText}>🔑</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.levelRow} onPress={() => setOpenSheet('levels')}>
        <Text style={styles.levelName}>🌿 {storehouse.progress.level.name}</Text>
        <Text style={styles.levelVerse}>{storehouse.progress.level.verse}</Text>
      </Pressable>

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
        <View style={[styles.sky, { height: SKY_HEIGHT }]}>
          {decorKeys.length > 0 && (
            <View style={styles.decorRow}>
              {decorKeys.map((key) => (
                <GardenLevelDecorSprite key={key} decorKey={key} pixelSize={1.8} />
              ))}
            </View>
          )}
        </View>
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
            <View style={styles.fenceRow}>
              <PixelGrid grid={fenceGrid} pixelSize={FENCE_PIXEL_SIZE} />
            </View>
            {memberSlots.map(renderSlot)}
          </ScrollView>
        </View>

        {slots.length > COLUMNS && <Text style={styles.scrollHint}>Scroll for more ↓</Text>}
      </View>

      <View style={styles.storehouseCard}>
        <View style={styles.storehouseTop}>
          <Text style={styles.storehouseLabel}>🏺 Storehouse</Text>
          {storehouse.progress.nextLevel ? (
            <Text style={styles.storehouseValue}>
              {storehouse.progress.intoTier} / {storehouse.progress.neededForNextTier} to{' '}
              {storehouse.progress.nextLevel.name}
            </Text>
          ) : (
            <Text style={styles.storehouseValue}>Highest level reached!</Text>
          )}
        </View>
        <ProgressBar percent={storehouse.progress.tierPercent} />
        {storehouse.givers.length > 0 && (
          <Text style={styles.storehouseGivers} numberOfLines={2}>
            Given by: {storehouse.givers.join(', ')}
          </Text>
        )}
        <Pressable
          style={styles.giveButton}
          onPress={() => {
            setDepositAmount(null);
            setCustomDepositText('');
            setOpenSheet('deposit');
          }}
        >
          <Text style={styles.giveButtonText}>Give drops</Text>
        </Pressable>
      </View>

      <View style={styles.iconRow}>
        <Pressable style={styles.iconButton} onPress={() => router.push(`/groups/${group.id}/shop`)}>
          <Text style={styles.iconGlyph}>▤</Text>
          <Text style={styles.iconLabel}>Shop</Text>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => setOpenSheet('levels')}>
          <Text style={styles.iconGlyph}>🌿</Text>
          <Text style={styles.iconLabel}>Upgrade</Text>
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={() => {
            setDepositAmount(null);
            setCustomDepositText('');
            setOpenSheet('deposit');
          }}
        >
          <Text style={styles.iconGlyph}>💧</Text>
          <Text style={styles.iconLabel}>Deposit</Text>
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={() => {
            setLeaveText('');
            setOpenSheet('leave');
          }}
        >
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

      <InfoSheet visible={openSheet === 'levels'} title="Garden levels" onClose={() => setOpenSheet(null)}>
        <ScrollView style={styles.levelsList}>
          {GARDEN_LEVELS.map((level) => {
            const reached = level.index <= storehouse.progress.level.index;
            const decorKey = getLevelDecorKey(level.index);
            return (
              <View key={level.key} style={styles.levelListRow}>
                <View style={styles.levelListPreview}>
                  {decorKey && <GardenLevelDecorSprite decorKey={decorKey} pixelSize={2.4} />}
                </View>
                <View style={styles.levelListTextBlock}>
                  <Text style={[styles.levelListName, !reached && styles.levelListTextLocked]}>
                    {reached ? '🌿' : '🔒'} {level.name}
                  </Text>
                  <Text style={[styles.levelListVerse, !reached && styles.levelListTextLocked]}>{level.verse}</Text>
                  {!reached && (
                    <Text style={styles.levelListCost}>+{level.costFromPrevious} drops to unlock this</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </InfoSheet>

      <InfoSheet visible={openSheet === 'deposit'} title="Give to the Storehouse" onClose={() => setOpenSheet(null)}>
        <Text style={styles.depositBody}>
          Give from your own balance of 💧 {drops.balance}. Once given, it can't be taken back.
        </Text>
        <View style={styles.depositChipRow}>
          {DEPOSIT_QUICK_AMOUNTS.map((amount) => (
            <Pressable
              key={amount}
              style={[styles.depositChip, depositAmount === amount && styles.depositChipSelected]}
              onPress={() => {
                setDepositAmount(amount);
                setCustomDepositText('');
              }}
              disabled={amount > drops.balance}
            >
              <Text
                style={[
                  styles.depositChipText,
                  depositAmount === amount && styles.depositChipTextSelected,
                  amount > drops.balance && styles.depositChipTextDisabled,
                ]}
              >
                {amount}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.depositChip, depositAmount === null && customDepositText !== '' && styles.depositChipSelected]}
            onPress={() => setDepositAmount(null)}
          >
            <Text style={styles.depositChipText}>Custom</Text>
          </Pressable>
        </View>
        {depositAmount === null && (
          <TextInput
            style={styles.depositInput}
            value={customDepositText}
            onChangeText={setCustomDepositText}
            placeholder={`Up to ${maxGivableAmount}`}
            keyboardType="number-pad"
          />
        )}
        <Pressable
          style={[styles.sheetPrimaryButton, (!canGiveDrops || depositing) && styles.giveButtonDisabled]}
          onPress={handleGiveDrops}
          disabled={!canGiveDrops || depositing}
        >
          <Text style={styles.sheetPrimaryButtonText}>
            {depositing ? 'Giving…' : effectiveDepositAmount ? `Give ${effectiveDepositAmount} drops` : 'Give drops'}
          </Text>
        </Pressable>
      </InfoSheet>

      <InfoSheet visible={openSheet === 'leave'} title="Leave this group" onClose={() => setOpenSheet(null)}>
        <Text style={styles.leaveBody}>
          You'll need a new invite code to rejoin. To confirm, type the group's name:{' '}
          <Text style={styles.leaveGroupName}>{group.name}</Text>
        </Text>
        <TextInput
          style={styles.leaveInput}
          value={leaveText}
          onChangeText={setLeaveText}
          placeholder={group.name}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={[
            styles.leaveButton,
            (leaveText.trim().toLowerCase() !== group.name.trim().toLowerCase() || leaving) &&
              styles.leaveButtonDisabled,
          ]}
          onPress={handleLeaveGroup}
          disabled={leaveText.trim().toLowerCase() !== group.name.trim().toLowerCase() || leaving}
        >
          <Text style={styles.leaveButtonText}>{leaving ? 'Leaving…' : `Leave ${group.name}`}</Text>
        </Pressable>
      </InfoSheet>

      <LevelUpCelebration level={celebratingLevel} onDismiss={() => setCelebratingLevel(null)} />
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
  topRowText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  topRowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  balanceBadge: {
    ...HARD_SHADOW,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.water,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  balanceBadgeText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  inviteBadge: {
    ...HARD_SHADOW,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.yellow,
    borderRadius: 8,
  },
  inviteBadgeText: {
    fontSize: 15,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  levelName: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  levelVerse: {
    fontFamily: FONTS.serifItalic,
    fontSize: 11,
    color: COLORS.sageDark,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  decorRow: {
    flexDirection: 'row',
    gap: 6,
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
  storehouseCard: {
    ...HARD_SHADOW,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    padding: 12,
    gap: 8,
  },
  storehouseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  storehouseLabel: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  storehouseValue: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  storehouseGivers: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  giveButton: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 10,
    alignItems: 'center',
  },
  giveButtonDisabled: {
    backgroundColor: COLORS.cream,
    opacity: 0.6,
  },
  giveButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
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
  levelsList: {
    maxHeight: 360,
  },
  levelListRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  levelListPreview: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.cream,
  },
  levelListTextBlock: {
    flex: 1,
  },
  levelListCost: {
    marginTop: 2,
    fontFamily: FONTS.headingMedium,
    fontSize: 11,
    color: COLORS.sageDark,
  },
  levelListName: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  levelListVerse: {
    marginTop: 2,
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    color: COLORS.sageDark,
  },
  levelListTextLocked: {
    color: COLORS.textMuted,
  },
  depositBody: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  depositChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  depositChip: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
  },
  depositChipSelected: {
    backgroundColor: COLORS.sage,
  },
  depositChipText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  depositChipTextSelected: {
    color: COLORS.textPrimary,
  },
  depositChipTextDisabled: {
    color: COLORS.textMuted,
  },
  depositInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    fontFamily: FONTS.serif,
    color: COLORS.textPrimary,
  },
  leaveBody: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  leaveGroupName: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  leaveInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    fontFamily: FONTS.serif,
    color: COLORS.textPrimary,
  },
  leaveButton: {
    ...buttonBase,
    backgroundColor: COLORS.pink,
    paddingVertical: 14,
    alignItems: 'center',
  },
  leaveButtonDisabled: {
    backgroundColor: COLORS.cream,
    opacity: 0.6,
  },
  leaveButtonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
});
