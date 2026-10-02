import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LambGuide } from '../../components/guide/LambGuide';
import { MonthCalendar } from '../../components/today/MonthCalendar';
import { Avatar } from '../../components/pixel/Avatar';
import type { LambMood } from '../../components/pixel/lamb-sprites';
import { ProgressBar } from '../../components/pixel/ProgressBar';
import { Tree } from '../../components/pixel/Tree';
import { buttonBase, COLORS, FONTS, HARD_SHADOW } from '../../components/theme';
import { getMyDashboard, type MyDashboard } from '../../lib/dashboard';
import { getErrorMessage } from '../../lib/error-message';
import { getMyProfile, type Profile } from '../../lib/profile';
import { getTreeStage, getTreeStageLabel, getNextStage, type TreeStage } from '../../lib/tree';

const WEEKLY_PERSONAL_GOAL = 5;
const RESTING_AFTER_DAYS = 3;
const STAGE_ORDER: TreeStage[] = ['seed', 'sprout', 'sapling', 'tree', 'fruiting'];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function buildLambGuide(dashboard: MyDashboard, stage: TreeStage, grewStage: boolean): { message: string; pose: LambMood; sparkles: boolean } {
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

  return { message: `${greeting()}! Your groups have a chapter waiting.`, pose: 'waving', sparkles: false };
}

export default function TodayDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dashboard, setDashboard] = useState<MyDashboard | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [grewStage, setGrewStage] = useState(false);
  const previousStageRef = useRef<TreeStage | null>(null);

  const load = useCallback(async () => {
    try {
      const [myProfile, myDashboard] = await Promise.all([getMyProfile(), getMyDashboard()]);
      const newStage = getTreeStage(myDashboard.totalCheckins);
      const previousStage = previousStageRef.current;
      setGrewStage(
        previousStage !== null && STAGE_ORDER.indexOf(newStage) > STAGE_ORDER.indexOf(previousStage)
      );
      previousStageRef.current = newStage;

      setProfile(myProfile);
      setDashboard(myDashboard);
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
  const weekPercent = Math.min(100, Math.round((dashboard.weekDaysRead / WEEKLY_PERSONAL_GOAL) * 100));
  const lambGuide = buildLambGuide(dashboard, stage, grewStage);

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
        <Avatar color={profile.avatar_color} name={profile.display_name} />
        <Text style={styles.greeting}>
          {greeting()}, {profile.display_name}
        </Text>
        <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
          <Text style={styles.settingsGlyph}>⚙</Text>
        </Pressable>
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <LambGuide
        id="today"
        message={lambGuide.message}
        pose={lambGuide.pose}
        sparkles={lambGuide.sparkles}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My tree</Text>
        <View style={styles.myTreeRow}>
          <Tree stage={stage} pixelSize={3} />
          <View style={styles.myTreeInfo}>
            <Text style={styles.myTreeStage}>
              {getTreeStageLabel(stage)} · {dashboard.totalCheckins} chapters read
            </Text>
            <Text style={styles.myTreeNext}>
              {nextStage ? `${nextStage.remaining} more to grow into a ${nextStage.label.toLowerCase()}` : "You've reached full growth!"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.weekRow}>
          <Text style={styles.cardTitle}>This week</Text>
          <Text style={styles.weekValue}>
            {dashboard.weekDaysRead} / {WEEKLY_PERSONAL_GOAL} days
          </Text>
        </View>
        <ProgressBar percent={weekPercent} />
      </View>

      <Text style={styles.sectionTitle}>Today's reading</Text>
      <View style={styles.readingList}>
        {dashboard.groups.length === 0 && (
          <Text style={styles.empty}>You're not in any groups yet — head to the Groups tab to join or create one.</Text>
        )}
        {dashboard.groups.map((row) => (
          <View key={row.group.id} style={styles.readingCard}>
            <View style={styles.readingInfo}>
              <Text style={styles.readingGroupName}>{row.group.name}</Text>
              <Text style={styles.readingChapter}>
                {row.finished ? `Finished ${row.group.book}!` : `${row.group.book} ${row.todayChapter}`}
              </Text>
            </View>
            {row.checkedInToday ? (
              <View style={styles.readTag}>
                <Text style={styles.readTagText}>Read ✓</Text>
              </View>
            ) : (
              <Pressable style={styles.readButton} onPress={() => router.push(`/groups/${row.group.id}/bible`)}>
                <Text style={styles.readButtonText}>Read now</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      <MonthCalendar checkinDates={dashboard.checkinDates} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 16,
    paddingTop: 56,
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
    gap: 12,
  },
  greeting: {
    flex: 1,
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  settingsGlyph: {
    fontSize: 20,
    color: COLORS.textMuted,
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
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  myTreeInfo: {
    flex: 1,
  },
  myTreeStage: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  myTreeNext: {
    marginTop: 4,
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  weekValue: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    marginTop: 4,
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.textPrimary,
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
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  readButtonText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  readTag: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#EDF8E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  readTagText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.success,
  },
});
