import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../../components/pixel/Badge';
import type { BadgeTier } from '../../components/pixel/badge-sprites';
import { ProgressBar } from '../../components/pixel/ProgressBar';
import { LambGuide } from '../../components/guide/LambGuide';
import { buttonBase, COLORS, FONTS, HARD_SHADOW } from '../../components/theme';
import { getDropsSummary, type DropsSummary } from '../../lib/drops';
import { getErrorMessage } from '../../lib/error-message';
import { getMissionSummary, type MissionProgress, type MissionSummary } from '../../lib/missions';

function tierForReward(reward: number): BadgeTier {
  if (reward >= 60) return 'special';
  if (reward >= 40) return 'gold';
  if (reward >= 20) return 'silver';
  return 'bronze';
}

function MissionCard({ mission, timeLabel }: { mission: MissionProgress; timeLabel?: string }) {
  const percent = mission.target > 0 ? (mission.progress / mission.target) * 100 : 0;
  return (
    <View style={[styles.card, mission.achieved && styles.cardAchieved]}>
      <Badge tier={tierForReward(mission.reward)} achieved={mission.achieved} pixelSize={3} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle}>{mission.title}</Text>
          <View style={styles.rewardTag}>
            <Text style={styles.rewardTagText}>+{mission.reward} 💧</Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>{mission.description}</Text>
        <ProgressBar percent={percent} segments={8} />
        <View style={styles.cardBottomRow}>
          <Text style={styles.cardProgressText}>
            {mission.achieved ? 'Complete!' : `${mission.progress} / ${mission.target}`}
          </Text>
          {timeLabel && !mission.achieved && <Text style={styles.cardTimeText}>{timeLabel}</Text>}
        </View>
      </View>
    </View>
  );
}

export default function MissionsScreen() {
  const [drops, setDrops] = useState<DropsSummary | null>(null);
  const [missions, setMissions] = useState<MissionSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [dropsSummary, missionSummary] = await Promise.all([getDropsSummary(), getMissionSummary()]);
      setDrops(dropsSummary);
      setMissions(missionSummary);
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

  if (!drops || !missions) {
    return (
      <View style={styles.center}>
        {errorMessage ? (
          <>
            <Text style={styles.error}>{errorMessage}</Text>
            <Pressable style={styles.retryButton} onPress={load}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator />
        )}
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Missions</Text>
          <Text style={styles.subtitle}>Extra ways to earn drops.</Text>
        </View>
        <View style={styles.balanceBadge}>
          <Text style={styles.balance}>💧 {drops.balance}</Text>
          <Text style={styles.balanceCaption}>yours to spend</Text>
        </View>
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <LambGuide
        id="missions"
        message={[
          'Complete missions to earn bonus drops for any garden.',
          'Your reading across every group counts here.',
          'Small goals add up — keep going!',
        ]}
        pose="happy"
        style={styles.lambGuide}
      />

      <Text style={styles.sectionLabel}>This week &amp; month</Text>
      <View style={styles.list}>
        {missions.periodMissions.map((mission) => (
          <MissionCard key={mission.key} mission={mission} timeLabel={mission.daysLeft !== undefined ? `${mission.daysLeft}d left` : undefined} />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Milestone badges</Text>
      <View style={styles.list}>
        {missions.milestones.map((mission) => (
          <MissionCard key={mission.key} mission={mission} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.background,
    flexGrow: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
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
    alignItems: 'center',
    ...HARD_SHADOW,
  },
  balance: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  balanceCaption: {
    fontFamily: FONTS.serif,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  lambGuide: {
    marginVertical: 4,
  },
  sectionLabel: {
    marginTop: 8,
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: 10,
  },
  card: {
    ...buttonBase,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.white,
    padding: 12,
    alignItems: 'flex-start',
  },
  cardAchieved: {
    backgroundColor: '#EFF8EC',
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  rewardTag: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: COLORS.yellow,
  },
  rewardTagText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  cardDescription: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardProgressText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  cardTimeText: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
