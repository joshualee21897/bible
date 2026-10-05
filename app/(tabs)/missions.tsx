import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../../components/pixel/Badge';
import type { BadgeTier } from '../../components/pixel/badge-sprites';
import { ProgressBar } from '../../components/pixel/ProgressBar';
import { LambGuide } from '../../components/guide/LambGuide';
import { DailyDrops } from '../../components/today/DailyDrops';
import { buttonBase, COLORS, FONTS, HARD_SHADOW } from '../../components/theme';
import { showAlert } from '../../lib/alert';
import { claimDailyDrop, getDailyDrops, type DailyDropKey, type DailyDropsSummary } from '../../lib/daily-drops';
import { getMyDashboard } from '../../lib/dashboard';
import { getDropsSummary, type DropsSummary } from '../../lib/drops';
import { getErrorMessage } from '../../lib/error-message';
import { SECTION_LABELS } from '../../lib/mission-config';
import { claimMission, getMissionSummary, type MissionProgress, type MissionSummary } from '../../lib/missions';

function tierForReward(reward: number): BadgeTier {
  if (reward >= 150) return 'special';
  if (reward >= 60) return 'gold';
  if (reward >= 20) return 'silver';
  return 'bronze';
}

function MissionCard({
  mission,
  collecting,
  onCollect,
}: {
  mission: MissionProgress;
  collecting: boolean;
  onCollect: (mission: MissionProgress) => void;
}) {
  const percent = mission.target > 0 ? (mission.progress / mission.target) * 100 : 0;

  let progressLabel: string;
  if (mission.repeatable) {
    progressLabel = mission.timesEarned && mission.timesEarned > 0 ? `Earned ${mission.timesEarned}×` : 'Not yet';
  } else if (mission.readyToCollect) {
    progressLabel = 'Complete!';
  } else if (mission.bookNames) {
    progressLabel = `${mission.progress} / ${mission.target} books`;
  } else {
    progressLabel = `${mission.progress} / ${mission.target}`;
  }

  return (
    <View style={[styles.card, mission.readyToCollect && styles.cardAchieved]}>
      <Badge tier={tierForReward(mission.reward)} achieved={mission.readyToCollect} pixelSize={3} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle}>{mission.title}</Text>
            <Text style={styles.cardVerse}>{mission.verse}</Text>
          </View>
          <View style={styles.rewardTag}>
            <Text style={styles.rewardTagText}>
              {mission.repeatable ? `+${mission.reward} ea` : `+${mission.reward}`} 💧
            </Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>{mission.description}</Text>
        {!mission.repeatable && <ProgressBar percent={percent} segments={8} />}
        <View style={styles.cardBottomRow}>
          <Text style={styles.cardProgressText}>{progressLabel}</Text>
          {mission.daysLeft !== undefined && !mission.readyToCollect && (
            <Text style={styles.cardTimeText}>{mission.daysLeft}d left</Text>
          )}
        </View>
        {mission.bookNames && (
          <Text style={styles.bookList}>
            {mission.bookNames
              .map((name) => `${mission.booksDone?.includes(name) ? '✓' : '·'} ${name}`)
              .join('   ')}
          </Text>
        )}
        {mission.readyToCollect && (
          <Pressable
            style={[styles.collectButton, collecting && styles.collectButtonDisabled]}
            onPress={() => onCollect(mission)}
            disabled={collecting}
          >
            <Text style={styles.collectButtonText}>{collecting ? 'Collecting…' : 'Collect'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function MissionsScreen() {
  const [drops, setDrops] = useState<DropsSummary | null>(null);
  const [missions, setMissions] = useState<MissionSummary | null>(null);
  const [dailyDrops, setDailyDrops] = useState<DailyDropsSummary | null>(null);
  const [waitingGroupId, setWaitingGroupId] = useState<string | null>(null);
  const [justCollectedFirst, setJustCollectedFirst] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collectingKey, setCollectingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [dropsSummary, missionSummary, myDailyDrops, myDashboard] = await Promise.all([
        getDropsSummary(),
        getMissionSummary(),
        getDailyDrops(),
        getMyDashboard(),
      ]);
      setDrops(dropsSummary);
      setMissions(missionSummary);
      setDailyDrops(myDailyDrops);
      const waitingGroup = myDashboard.groups.find((row) => !row.checkedInToday);
      setWaitingGroupId(waitingGroup ? waitingGroup.group.id : null);
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

  async function handleCollect(key: DailyDropKey) {
    if (!dailyDrops || !drops) return;
    const row = dailyDrops.rows.find((r) => r.key === key);
    if (!row || row.status !== 'collect') return;

    const wasFirstOfDay = dailyDrops.collectedCount === 0;
    const updatedRows = dailyDrops.rows.map((r) => (r.key === key ? { ...r, status: 'collected' as const } : r));
    const updatedCollectedCount = dailyDrops.collectedCount + 1;
    setDailyDrops({
      rows: updatedRows,
      collectedCount: updatedCollectedCount,
      allCollected: updatedCollectedCount === updatedRows.length,
    });
    setDrops({ ...drops, balance: drops.balance + row.reward });
    if (wasFirstOfDay) setJustCollectedFirst(true);

    try {
      await claimDailyDrop(key);
    } catch {
      // Resync with the server rather than leaving an optimistic state that
      // might not match (e.g. the request actually failed).
      load();
    }
  }

  function handleDailyBreadPress() {
    if (waitingGroupId) {
      router.push(`/groups/${waitingGroupId}/bible`);
    }
  }

  async function handleCollectMission(mission: MissionProgress) {
    if (!drops || collectingKey) return;
    setCollectingKey(mission.key);
    try {
      const reward = await claimMission(mission.key, mission.periodKey);
      setDrops({ ...drops, balance: drops.balance + reward });
      setMissions((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections
            .map((section) => ({
              ...section,
              missions: section.missions.filter((m) => m.key !== mission.key || m.periodKey !== mission.periodKey),
            }))
            .filter((section) => section.missions.length > 0),
        };
      });
    } catch (error) {
      showAlert('Something went wrong', getErrorMessage(error));
    } finally {
      setCollectingKey(null);
    }
  }

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
        message={
          justCollectedFirst
            ? 'Fresh manna for today!'
            : [
                'Complete missions to earn bonus drops for any garden.',
                'Your reading across every group counts here.',
                'Small goals add up — keep going!',
              ]
        }
        pose="happy"
        sparkles={justCollectedFirst}
        style={styles.lambGuide}
      />

      {dailyDrops && (
        <DailyDrops
          rows={dailyDrops.rows}
          allCollected={dailyDrops.allCollected}
          onCollect={handleCollect}
          onDailyBreadPress={handleDailyBreadPress}
        />
      )}

      {missions.sections.map(({ section, missions: sectionMissions }) => (
        <View key={section}>
          <Text style={styles.sectionLabel}>{SECTION_LABELS[section]}</Text>
          <View style={styles.list}>
            {sectionMissions.map((mission) => (
              <MissionCard
                key={`${mission.key}:${mission.periodKey}`}
                mission={mission}
                collecting={collectingKey === mission.key}
                onCollect={handleCollectMission}
              />
            ))}
          </View>
        </View>
      ))}
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
    marginBottom: 10,
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
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  cardVerse: {
    fontFamily: FONTS.serifItalic,
    fontSize: 11,
    color: COLORS.sageDark,
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
  bookList: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  collectButton: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  collectButtonDisabled: {
    opacity: 0.6,
  },
  collectButtonText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
});
