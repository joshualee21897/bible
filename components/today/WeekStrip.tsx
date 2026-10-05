import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../theme';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SWIPE_THRESHOLD = 40;

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

export function WeekStrip({ checkinDates, weeklyGoal }: { checkinDates: Set<string>; weeklyGoal: number }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const todayKey = toDateKey(new Date());

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx <= -SWIPE_THRESHOLD) {
          setWeekOffset((offset) => Math.min(0, offset + 1));
        } else if (gesture.dx >= SWIPE_THRESHOLD) {
          setWeekOffset((offset) => offset - 1);
        }
      },
    })
  ).current;

  const weekStart = getWeekStart(weekOffset);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    const key = toDateKey(date);
    return { key, dayNumber: date.getDate(), checked: checkinDates.has(key), isToday: key === todayKey };
  });
  const daysReadThisWeek = days.filter((d) => d.checked).length;

  return (
    <View {...panResponder.panHandlers}>
      <View style={styles.header}>
        <Text style={styles.weekLabel}>{weekLabel(weekOffset, weekStart)}</Text>
        <Text style={styles.weekCount}>
          {daysReadThisWeek} / {weeklyGoal} days this week
        </Text>
      </View>
      <View style={styles.strip}>
        {days.map((day, index) => (
          <View key={day.key} style={styles.dayColumn}>
            <Text style={styles.weekdayLabel}>{WEEKDAY_LABELS[index]}</Text>
            <View style={[styles.dayCircle, day.checked && styles.dayCircleChecked, day.isToday && styles.dayCircleToday]}>
              <Text style={styles.dayGlyph}>{day.checked ? '🌱' : day.dayNumber}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  weekLabel: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  weekCount: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  weekdayLabel: {
    fontFamily: FONTS.serif,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  dayCircleChecked: {
    backgroundColor: COLORS.sage,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dayGlyph: {
    fontFamily: FONTS.headingMedium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
