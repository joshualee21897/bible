import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { buttonBase, COLORS, FONTS } from '../theme';
import type { DailyDropKey, DailyDropRow } from '../../lib/daily-drops';

type Props = {
  rows: DailyDropRow[];
  allCollected: boolean;
  onCollect: (key: DailyDropKey) => void;
  onDailyBreadPress: () => void;
};

function DailyDropRowItem({
  row,
  onCollect,
  onDailyBreadPress,
}: {
  row: DailyDropRow;
  onCollect: (key: DailyDropKey) => void;
  onDailyBreadPress: () => void;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [showFlourish, setShowFlourish] = useState(false);

  function handlePress() {
    if (row.status === 'collect') {
      setShowFlourish(true);
      floatAnim.setValue(0);
      Animated.timing(floatAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start(() => {
        setShowFlourish(false);
      });
      onCollect(row.key);
    } else if (row.status === 'growing' && row.key === 'daily_bread') {
      onDailyBreadPress();
    }
  }

  const buttonStyle =
    row.status === 'collect' ? styles.collectButton : row.status === 'collected' ? styles.collectedButton : styles.growingButton;
  const buttonTextStyle =
    row.status === 'collect'
      ? styles.collectButtonText
      : row.status === 'collected'
        ? styles.collectedButtonText
        : styles.growingButtonText;
  const buttonLabel = row.status === 'collect' ? 'Collect' : row.status === 'collected' ? 'Collected ✓' : 'Growing';

  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle}>{row.title}</Text>
          {row.verse ? <Text style={styles.rowVerse}>{row.verse}</Text> : null}
        </View>
        <Text style={styles.rowDescription}>{row.description}</Text>
      </View>
      <View style={styles.rowAction}>
        {showFlourish && (
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.flourish,
              {
                opacity: floatAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }],
              },
            ]}
          >
            +{row.reward} 💧
          </Animated.Text>
        )}
        <Pressable
          style={buttonStyle}
          onPress={handlePress}
          disabled={row.status === 'collected' || (row.status === 'growing' && row.key !== 'daily_bread')}
        >
          <Text style={buttonTextStyle}>{buttonLabel}</Text>
        </Pressable>
        <Text style={styles.rewardLabel}>+{row.reward} 💧</Text>
      </View>
    </View>
  );
}

export function DailyDrops({ rows, allCollected, onCollect, onDailyBreadPress }: Props) {
  const [collapsed, setCollapsed] = useState(allCollected);

  useEffect(() => {
    if (allCollected) setCollapsed(true);
  }, [allCollected]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily drops</Text>
      </View>

      {collapsed ? (
        <Pressable style={styles.collapsedCard} onPress={() => setCollapsed(false)}>
          <Text style={styles.collapsedText}>All collected today ✓</Text>
        </Pressable>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => (
            <DailyDropRowItem key={row.key} row={row} onCollect={onCollect} onDailyBreadPress={onDailyBreadPress} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...buttonBase,
    backgroundColor: COLORS.white,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collapsedCard: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#EDF8E9',
    paddingVertical: 12,
    alignItems: 'center',
  },
  collapsedText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 13,
    color: COLORS.success,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: COLORS.cream,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  rowTitle: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  rowVerse: {
    fontFamily: FONTS.serifItalic,
    fontSize: 10,
    color: COLORS.sageDark,
  },
  rowDescription: {
    marginTop: 2,
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  rowAction: {
    alignItems: 'center',
    position: 'relative',
  },
  flourish: {
    position: 'absolute',
    top: -18,
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.success,
  },
  growingButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.background,
    opacity: 0.6,
  },
  growingButtonText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  collectButton: {
    ...buttonBase,
    backgroundColor: COLORS.sage,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  collectButtonText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  collectedButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EDF8E9',
  },
  collectedButtonText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 11,
    color: COLORS.success,
  },
  rewardLabel: {
    marginTop: 3,
    fontFamily: FONTS.serif,
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
