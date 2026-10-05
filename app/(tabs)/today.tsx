import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LambGuide } from '../../components/guide/LambGuide';
import { MonthCalendar } from '../../components/today/MonthCalendar';
import { WeekStrip } from '../../components/today/WeekStrip';
import { Avatar } from '../../components/pixel/Avatar';
import type { LambMood } from '../../components/pixel/lamb-sprites';
import { ProgressBar } from '../../components/pixel/ProgressBar';
import { Tree } from '../../components/pixel/Tree';
import { buttonBase, COLORS, FONTS, HARD_SHADOW } from '../../components/theme';
import { getMyDashboard, type MyDashboard, type MyGroupToday } from '../../lib/dashboard';
import { getDropsSummary } from '../../lib/drops';
import { getErrorMessage } from '../../lib/error-message';
import { getGroupPulses, type GroupPulse } from '../../lib/group-pulse';
import { getMyProfile, type Profile } from '../../lib/profile';
import { getReactionsFor } from '../../lib/reactions';
import {
  getNextStage,
  getStageProgressPercent,
  getStageSegments,
  getTreeStage,
  getTreeStageLabel,
  type TreeStage,
} from '../../lib/tree';

const WEEKLY_PERSONAL_GOAL = 5;
const RESTING_AFTER_DAYS = 3;
const STAGE_ORDER: TreeStage[] = ['seed', 'sprout', 'sapling', 'tree', 'fruiting'];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function buildLambGuide(
  dashboard: MyDashboard,
  stage: TreeStage,
  grewStage: boolean
): { message: string; pose: LambMood; sparkles: boolean } {
  if (grewStage) {
    return { message: 'Your tree just grew! Keep going.', pose: 'happy', sparkles: true };
  }

  const groupThatBoreFruit = dashboard.groups.find((row) => row.meetsHarvestThreshold);
  if (groupThatBoreFruit) {
    return {
      message: 'Our garden bore fruit this week! Time for a Harvest Supper?',
      pose: 'happy',
      sparkles: true,
    };
  }

  const daysSinceLastCheckin = dashboard.lastCheckinAt
    ? (Date.now() - new Date(dashboard.lastCheckinAt).getTime()) / (1000 * 60 * 60 * 24)
    : null;
  if (daysSinceLastCheckin !== null && daysSinceLastCheckin >= RESTING_AFTER_DAYS) {
    return { message: 'Welcome back! His mercies are new every morning.', pose: 'waving', sparkles: false };
  }

  if (new Date().getDay() === 0) {
    return { message: 'Be strong and of a good courage. — Joshua 1:9', pose: 'happy', sparkles: false };
  }

  if (dashboard.groups.length === 0) {
    return { message: 'Join or create a group to start a garden.', pose: 'waving', sparkles: false };
  }

  const waitingGroups = dashboard.groups.filter((row) => !row.checkedInToday);
  if (waitingGroups.length === 0) {
    return { message: `${greeting()}! Our gardens are happy today.`, pose: 'happy', sparkles: false };
  }
  if (waitingGroups.length === 1) {
    const row = waitingGroups[0];
    return {
      message: row.finished ? `${greeting()}! Your groups have a chapter waiting.` : `${row.group.book} ${row.todayChapter} is waiting for you.`,
      pose: 'waving',
      sparkles: false,
    };
  }

  return { message: `You have ${pluralize(waitingGroups.length, 'chapter')} waiting for you.`, pose: 'waving', sparkles: false };
}

function groupPulseText(pulse: GroupPulse | undefined): string {
  if (!pulse) return 'No activity yet today';
  const parts: string[] = [];
  if (pulse.latestCheckinName) parts.push(`${pulse.latestCheckinName} checked in`);
  if (pulse.newPrayersCount > 0) parts.push(`${pluralize(pulse.newPrayersCount, 'new prayer')}`);
  return parts.length > 0 ? parts.join(' · ') : 'No activity yet today';
}

export default function TodayDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dashboard, setDashboard] = useState<MyDashboard | null>(null);
  const [balance, setBalance] = useState(0);
  const [amenCounts, setAmenCounts] = useState<Record<string, number>>({});
  const [groupPulses, setGroupPulses] = useState<Record<string, GroupPulse>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [grewStage, setGrewStage] = useState(false);
  const [monthExpanded, setMonthExpanded] = useState(false);
  const previousStageRef = useRef<TreeStage | null>(null);

  const load = useCallback(async () => {
    try {
      const [myProfile, myDashboard, dropsSummary] = await Promise.all([
        getMyProfile(),
        getMyDashboard(),
        getDropsSummary(),
      ]);
      const newStage = getTreeStage(myDashboard.totalCheckins);
      const previousStage = previousStageRef.current;
      setGrewStage(
        previousStage !== null && STAGE_ORDER.indexOf(newStage) > STAGE_ORDER.indexOf(previousStage)
      );
      previousStageRef.current = newStage;

      setProfile(myProfile);
      setDashboard(myDashboard);
      setBalance(dropsSummary.balance);
      setErrorMessage(null);

      const todayCheckinIds = myDashboard.groups
        .map((row) => row.todayCheckinId)
        .filter((id): id is string => id !== null);
      const groupIds = myDashboard.groups.map((row) => row.group.id);
      const [reactions, pulses] = await Promise.all([
        getReactionsFor('checkin', todayCheckinIds),
        getGroupPulses(groupIds),
      ]);
      setAmenCounts(reactions.counts);
      setGroupPulses(pulses);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (errorMessage && !dashboard) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMessage}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!dashboard || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const stage = getTreeStage(dashboard.totalCheckins);
  const nextStage = getNextStage(dashboard.totalCheckins);
  const stageProgressPercent = getStageProgressPercent(dashboard.totalCheckins);
  const stageSegments = getStageSegments(dashboard.totalCheckins);
  const lambGuide = buildLambGuide(dashboard, stage, grewStage);

  function renderReadingRow(row: MyGroupToday) {
    const amenCount = row.todayCheckinId ? (amenCounts[row.todayCheckinId] ?? 0) : 0;
    return (
      <View key={row.group.id} style={styles.readingCard}>
        <View style={styles.readingInfo}>
          <Text style={styles.readingGroupName}>{row.group.name}</Text>
          <Text style={styles.readingChapter}>
            {row.finished ? `Finished ${row.group.book}!` : `${row.group.book} ${row.todayChapter}`}
          </Text>
        </View>
        {row.checkedInToday ? (
          <View style={styles.readTag}>
            <Text style={styles.readTagText}>Checked in ✓</Text>
            {amenCount > 0 && <Text style={styles.readTagAmen}>🙏 {amenCount}</Text>}
          </View>
        ) : (
          <Pressable style={styles.readButton} onPress={() => router.push(`/groups/${row.group.id}/bible`)}>
            <Text style={styles.readButtonText}>Read now</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
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
      <View style={styles.profileRow}>
        <Avatar color={profile.avatar_color} name={profile.display_name} size={36} />
        <Text style={styles.greeting}>
          {greeting()}, {profile.display_name}
        </Text>
        <View style={styles.balanceChip}>
          <Text style={styles.balanceChipText}>💧 {balance}</Text>
        </View>
        <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
          <Text style={styles.settingsGlyph}>⚙</Text>
        </Pressable>
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <View style={styles.heroCard}>
        <LambGuide id="today" message={lambGuide.message} pose={lambGuide.pose} sparkles={lambGuide.sparkles} />
        <Text style={styles.heroTitle}>Today's reading</Text>
        <View style={styles.readingList}>
          {dashboard.groups.length === 0 && (
            <Text style={styles.empty}>You're not in any groups yet — head to the Groups tab to join or create one.</Text>
          )}
          {dashboard.groups.map(renderReadingRow)}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.myTreeRow}>
          <Tree stage={stage} pixelSize={5} />
          <View style={styles.myTreeInfo}>
            <Text style={styles.myTreeStage}>{getTreeStageLabel(stage)}</Text>
            <Text style={styles.myTreeCount}>{pluralize(dashboard.totalCheckins, 'chapter')} read</Text>
            {nextStage ? (
              <>
                <ProgressBar
                  percent={stageProgressPercent}
                  segments={stageSegments?.segments ?? 8}
                  filled={stageSegments?.filled}
                />
                <Text style={styles.myTreeNext}>
                  {pluralize(nextStage.remaining, 'more')} to grow into a {nextStage.label.toLowerCase()}
                </Text>
              </>
            ) : (
              <Text style={styles.myTreeNext}>You've reached full growth!</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <WeekStrip checkinDates={dashboard.checkinDates} weeklyGoal={WEEKLY_PERSONAL_GOAL} />

        <Pressable style={styles.monthToggle} onPress={() => setMonthExpanded((v) => !v)}>
          <Text style={styles.monthToggleText}>{monthExpanded ? 'Show less ▴' : 'See my month ▾'}</Text>
        </Pressable>
        {monthExpanded && <MonthCalendar checkinDates={dashboard.checkinDates} bare />}
      </View>

      {dashboard.groups.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Group pulse</Text>
          <View style={styles.pulseList}>
            {dashboard.groups.map((row) => (
              <Pressable
                key={row.group.id}
                style={styles.pulseRow}
                onPress={() => router.push(`/groups/${row.group.id}/feed`)}
              >
                <Text style={styles.pulseGroupName}>{row.group.name}</Text>
                <Text style={styles.pulseText}>{groupPulseText(groupPulses[row.group.id])}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 16,
    paddingTop: 52,
    paddingBottom: 40,
    gap: 14,
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    flex: 1,
    fontFamily: FONTS.heading,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  balanceChip: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.water,
    paddingVertical: 5,
    paddingHorizontal: 9,
    ...HARD_SHADOW,
  },
  balanceChipText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  settingsGlyph: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  heroCard: {
    ...buttonBase,
    backgroundColor: COLORS.white,
    padding: 14,
    gap: 10,
  },
  heroTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  card: {
    ...buttonBase,
    backgroundColor: COLORS.white,
    padding: 14,
  },
  cardTitle: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  myTreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  myTreeInfo: {
    flex: 1,
    gap: 4,
  },
  myTreeStage: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  myTreeCount: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  myTreeNext: {
    marginTop: 4,
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  divider: {
    height: 2,
    backgroundColor: COLORS.background,
    marginVertical: 14,
  },
  monthToggle: {
    marginTop: 12,
    alignItems: 'center',
  },
  monthToggleText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.sageDark,
  },
  readingList: {
    gap: 10,
  },
  empty: {
    fontFamily: FONTS.serif,
    color: COLORS.textMuted,
  },
  readingCard: {
    ...HARD_SHADOW,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  readingInfo: {
    flex: 1,
  },
  readingGroupName: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  readingChapter: {
    marginTop: 2,
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  readButton: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  readButtonText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  readTag: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#EDF8E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
  },
  readTagText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.success,
  },
  readTagAmen: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  pulseList: {
    marginTop: 8,
    gap: 10,
  },
  pulseRow: {
    gap: 2,
  },
  pulseGroupName: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  pulseText: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
