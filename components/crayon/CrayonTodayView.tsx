import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { MyDashboard, MyGroupToday } from '../../lib/dashboard';
import type { GroupPulse } from '../../lib/group-pulse';
import type { Profile } from '../../lib/profile';
import { CRAYON_COLORS, CRAYON_FONTS } from '../../lib/theme-crayon';
import { greeting, groupPulseText, pluralize } from '../../lib/today-helpers';
import { getTreeStageLabel, type TreeStage } from '../../lib/tree';
import type { LambMood } from '../pixel/lamb-sprites';
import { Avatar } from '../pixel/Avatar';
import { CrayonButton } from './CrayonButton';
import { CrayonCard } from './CrayonCard';
import { CrayonProgressBar } from './CrayonProgressBar';
import { Gear } from './Gear';
import { Lamb } from './Lamb';
import { Sprout } from './Sprout';
import { Tree } from './Tree';
import { WaterDrop } from './WaterDrop';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getWeekStart(offset: number): Date {
  const now = new Date();
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  return new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + offset * 7);
}

function weekLabel(offset: number, weekStart: Date): string {
  if (offset === 0) return 'This week';
  if (offset === -1) return 'Last week';
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${format(weekStart)} – ${format(weekEnd)}`;
}

function CrayonWeekStrip({ checkinDates, weeklyGoal }: { checkinDates: Set<string>; weeklyGoal: number }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const todayKey = toDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const weekStart = getWeekStart(weekOffset);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    const key = toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
    return { key, dayNumber: date.getDate(), checked: checkinDates.has(key), isToday: key === todayKey };
  });
  const daysReadThisWeek = days.filter((d) => d.checked).length;

  return (
    <View>
      <View style={styles.weekHeader}>
        <Pressable onPress={() => setWeekOffset((o) => o - 1)} hitSlop={8}>
          <Text style={styles.weekArrow}>‹</Text>
        </Pressable>
        <View style={styles.weekHeaderText}>
          <Text style={styles.weekLabel}>{weekLabel(weekOffset, weekStart)}</Text>
          <Text style={styles.weekCount}>
            {daysReadThisWeek} / {weeklyGoal} days
          </Text>
        </View>
        <Pressable onPress={() => setWeekOffset((o) => Math.min(0, o + 1))} hitSlop={8} disabled={weekOffset >= 0}>
          <Text style={[styles.weekArrow, weekOffset >= 0 && styles.weekArrowDisabled]}>›</Text>
        </Pressable>
      </View>
      <View style={styles.weekStrip}>
        {days.map((day, index) => (
          <View key={day.key} style={styles.dayColumn}>
            <Text style={styles.weekdayLabel}>{WEEKDAY_LABELS[index]}</Text>
            <View style={[styles.dayCircle, day.checked && styles.dayCircleChecked, day.isToday && styles.dayCircleToday]}>
              {day.checked ? <Sprout size={16} /> : <Text style={styles.dayGlyph}>{day.dayNumber}</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function CrayonMonthCalendar({ checkinDates }: { checkinDates: Set<string> }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const todayKey = toDateKey(year, month, now.getDate());
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const daysReadThisMonth = days.filter((d) => checkinDates.has(toDateKey(year, month, d))).length;
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...days];

  return (
    <View style={styles.monthWrap}>
      <View style={styles.monthHeaderRow}>
        <Text style={styles.monthTitle}>This month</Text>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
      </View>
      <Text style={styles.monthSummary}>{pluralize(daysReadThisMonth, 'reading day')} so far</Text>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={index} style={styles.monthWeekdayLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {cells.map((day, index) => {
          if (day === null) return <View key={index} style={styles.monthCell} />;
          const key = toDateKey(year, month, day);
          const checked = checkinDates.has(key);
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          return (
            <View key={index} style={styles.monthCell}>
              <View
                style={[
                  styles.monthDayBox,
                  checked && styles.monthDayBoxChecked,
                  isToday && styles.monthDayBoxToday,
                  isFuture && styles.monthDayBoxFuture,
                ]}
              >
                {checked ? <Sprout size={14} /> : <Text style={styles.monthDayText}>{day}</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

type Props = {
  profile: Profile;
  dashboard: MyDashboard;
  balance: number;
  stage: TreeStage;
  nextStage: { label: string; remaining: number } | null;
  stageProgressPercent: number;
  lambGuide: { message: string; pose: LambMood; sparkles: boolean };
  amenCounts: Record<string, number>;
  groupPulses: Record<string, GroupPulse>;
  monthExpanded: boolean;
  setMonthExpanded: (updater: (v: boolean) => boolean) => void;
  refreshing: boolean;
  onRefresh: () => void;
  errorMessage: string | null;
  weeklyGoal: number;
};

export function CrayonTodayView({
  profile,
  dashboard,
  balance,
  stage,
  nextStage,
  stageProgressPercent,
  lambGuide,
  amenCounts,
  groupPulses,
  monthExpanded,
  setMonthExpanded,
  refreshing,
  onRefresh,
  errorMessage,
  weeklyGoal,
}: Props) {
  function renderReadingRow(row: MyGroupToday) {
    const amenCount = row.todayCheckinId ? (amenCounts[row.todayCheckinId] ?? 0) : 0;
    return (
      <View key={row.group.id} style={styles.readingRow}>
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
          <CrayonButton label="Read now" tone="sage" onPress={() => router.push(`/groups/${row.group.id}/bible`)} />
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Avatar color={profile.avatar_color} name={profile.display_name} size={36} />
        <Text style={styles.greeting}>
          {greeting()}, {profile.display_name}
        </Text>
        <View style={styles.balanceChip}>
          <WaterDrop size={14} />
          <Text style={styles.balanceChipText}>{balance}</Text>
        </View>
        <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
          <Gear size={20} />
        </Pressable>
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <CrayonCard>
        <View style={styles.lambRow}>
          <Lamb size={56} />
          <View style={styles.lambBubble}>
            <Text style={styles.lambText}>
              {lambGuide.message}
              {lambGuide.sparkles ? ' ✨' : ''}
            </Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Today's reading</Text>
        <View style={styles.readingList}>
          {dashboard.groups.length === 0 && (
            <Text style={styles.empty}>You're not in any groups yet — head to the Groups tab to join or create one.</Text>
          )}
          {dashboard.groups.map(renderReadingRow)}
        </View>
      </CrayonCard>

      <CrayonCard>
        <View style={styles.myTreeRow}>
          <Tree stage={stage} size={64} />
          <View style={styles.myTreeInfo}>
            <Text style={styles.myTreeStage}>{getTreeStageLabel(stage)}</Text>
            <Text style={styles.myTreeCount}>{pluralize(dashboard.totalCheckins, 'chapter')} read</Text>
            {nextStage ? (
              <>
                <CrayonProgressBar percent={stageProgressPercent} tone="sage" />
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

        <CrayonWeekStrip checkinDates={dashboard.checkinDates} weeklyGoal={weeklyGoal} />

        <Pressable style={styles.monthToggle} onPress={() => setMonthExpanded((v) => !v)}>
          <Text style={styles.monthToggleText}>{monthExpanded ? 'Show less ▴' : 'See my month ▾'}</Text>
        </Pressable>
        {monthExpanded && <CrayonMonthCalendar checkinDates={dashboard.checkinDates} />}
      </CrayonCard>

      {dashboard.groups.length > 0 && (
        <CrayonCard>
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
        </CrayonCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: CRAYON_COLORS.background,
  },
  container: {
    padding: 16,
    paddingTop: 52,
    paddingBottom: 40,
    gap: 16,
  },
  error: {
    color: CRAYON_COLORS.error,
    textAlign: 'center',
    fontFamily: CRAYON_FONTS.serif,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    flex: 1,
    fontFamily: CRAYON_FONTS.heading,
    fontSize: 20,
    color: CRAYON_COLORS.textPrimary,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: CRAYON_COLORS.border,
    borderRadius: 14,
    backgroundColor: CRAYON_COLORS.sky,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  balanceChipText: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 15,
    color: CRAYON_COLORS.textPrimary,
  },
  lambRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lambBubble: {
    flex: 1,
  },
  lambText: {
    fontFamily: CRAYON_FONTS.headingMedium,
    fontSize: 16,
    color: CRAYON_COLORS.textPrimary,
  },
  heroTitle: {
    marginTop: 12,
    fontFamily: CRAYON_FONTS.heading,
    fontSize: 20,
    color: CRAYON_COLORS.textPrimary,
  },
  readingList: {
    marginTop: 8,
    gap: 10,
  },
  empty: {
    fontFamily: CRAYON_FONTS.serif,
    color: CRAYON_COLORS.textMuted,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: CRAYON_COLORS.border,
    paddingBottom: 10,
  },
  readingInfo: {
    flex: 1,
  },
  readingGroupName: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 17,
    color: CRAYON_COLORS.textPrimary,
  },
  readingChapter: {
    marginTop: 2,
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 13,
    color: CRAYON_COLORS.textMuted,
  },
  readTag: {
    alignItems: 'center',
    gap: 2,
  },
  readTagText: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 15,
    color: CRAYON_COLORS.success,
  },
  readTagAmen: {
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 12,
    color: CRAYON_COLORS.textMuted,
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
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 19,
    color: CRAYON_COLORS.textPrimary,
  },
  myTreeCount: {
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 13,
    color: CRAYON_COLORS.textMuted,
    marginBottom: 4,
  },
  myTreeNext: {
    marginTop: 4,
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 12,
    color: CRAYON_COLORS.textMuted,
  },
  divider: {
    height: 2,
    backgroundColor: CRAYON_COLORS.background,
    marginVertical: 14,
    opacity: 0.6,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekHeaderText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 6,
  },
  weekArrow: {
    fontFamily: CRAYON_FONTS.heading,
    fontSize: 22,
    color: CRAYON_COLORS.textPrimary,
    paddingHorizontal: 4,
  },
  weekArrowDisabled: {
    color: CRAYON_COLORS.textMuted,
    opacity: 0.4,
  },
  weekLabel: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 14,
    color: CRAYON_COLORS.textMuted,
  },
  weekCount: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 14,
    color: CRAYON_COLORS.textPrimary,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  weekdayLabel: {
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 11,
    color: CRAYON_COLORS.textMuted,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CRAYON_COLORS.background,
    borderWidth: 1.5,
    borderColor: CRAYON_COLORS.border,
  },
  dayCircleChecked: {
    backgroundColor: CRAYON_COLORS.sage,
  },
  dayCircleToday: {
    borderWidth: 2.5,
  },
  dayGlyph: {
    fontFamily: CRAYON_FONTS.headingMedium,
    fontSize: 13,
    color: CRAYON_COLORS.textMuted,
  },
  monthToggle: {
    marginTop: 12,
    alignItems: 'center',
  },
  monthToggleText: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 14,
    color: CRAYON_COLORS.textPrimary,
  },
  monthWrap: {
    marginTop: 10,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  monthTitle: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 14,
    color: CRAYON_COLORS.textMuted,
  },
  monthLabel: {
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 13,
    color: CRAYON_COLORS.textMuted,
  },
  monthSummary: {
    marginTop: 6,
    marginBottom: 10,
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 16,
    color: CRAYON_COLORS.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  monthWeekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 12,
    color: CRAYON_COLORS.textMuted,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  monthDayBox: {
    width: '78%',
    height: '78%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayBoxChecked: {
    backgroundColor: CRAYON_COLORS.sage,
  },
  monthDayBoxToday: {
    borderWidth: 2,
    borderColor: CRAYON_COLORS.border,
  },
  monthDayBoxFuture: {
    opacity: 0.35,
  },
  monthDayText: {
    fontFamily: CRAYON_FONTS.headingMedium,
    fontSize: 13,
    color: CRAYON_COLORS.textMuted,
  },
  cardTitle: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 15,
    color: CRAYON_COLORS.textMuted,
  },
  pulseList: {
    marginTop: 8,
    gap: 10,
  },
  pulseRow: {
    gap: 2,
  },
  pulseGroupName: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 16,
    color: CRAYON_COLORS.textPrimary,
  },
  pulseText: {
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 13,
    color: CRAYON_COLORS.textMuted,
  },
});
