import { StyleSheet, Text, View } from 'react-native';

import { buttonBase, COLORS, FONTS } from '../theme';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function MonthCalendar({ checkinDates }: { checkinDates: Set<string> }) {
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
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>This month</Text>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
      </View>
      <Text style={styles.summary}>
        {daysReadThisMonth} reading day{daysReadThisMonth === 1 ? '' : 's'} so far
      </Text>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={index} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) return <View key={index} style={styles.cell} />;

          const key = toDateKey(year, month, day);
          const checked = checkinDates.has(key);
          const isToday = key === todayKey;
          const isFuture = key > todayKey;

          return (
            <View key={index} style={styles.cell}>
              <View
                style={[
                  styles.dayBox,
                  checked && styles.dayBoxChecked,
                  isToday && styles.dayBoxToday,
                  isFuture && styles.dayBoxFuture,
                ]}
              >
                <Text style={[styles.dayText, checked && styles.dayTextChecked, isFuture && styles.dayTextFuture]}>
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...buttonBase,
    backgroundColor: COLORS.white,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cardTitle: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthLabel: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  summary: {
    marginTop: 6,
    marginBottom: 10,
    fontFamily: FONTS.headingSemiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayBox: {
    width: '78%',
    height: '78%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBoxChecked: {
    backgroundColor: COLORS.sage,
  },
  dayBoxToday: {
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dayBoxFuture: {
    opacity: 0.35,
  },
  dayText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  dayTextChecked: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
  dayTextFuture: {
    color: COLORS.textMuted,
  },
});
