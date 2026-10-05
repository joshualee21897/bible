import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DailyDropKey, DailyDropRow } from '../../lib/daily-drops';
import { CRAYON_COLORS, CRAYON_FONTS } from '../../lib/theme-crayon';
import { CrayonButton } from './CrayonButton';
import { CrayonCard } from './CrayonCard';
import { WaterDrop } from './WaterDrop';

type Props = {
  rows: DailyDropRow[];
  allCollected: boolean;
  onCollect: (key: DailyDropKey) => void;
  onDailyBreadPress: () => void;
};

function CrayonDailyDropRow({
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
          <Animated.View
            pointerEvents="none"
            style={[
              styles.flourish,
              {
                opacity: floatAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }],
              },
            ]}
          >
            <Text style={styles.flourishText}>+{row.reward}</Text>
            <WaterDrop size={12} />
          </Animated.View>
        )}
        {row.status === 'collect' ? (
          <CrayonButton label="Collect" tone="sage" onPress={handlePress} style={styles.smallButton} />
        ) : (
          <Pressable
            style={[styles.plainButton, row.status === 'collected' && styles.plainButtonCollected]}
            onPress={handlePress}
            disabled={row.status === 'collected' || (row.status === 'growing' && row.key !== 'daily_bread')}
          >
            <Text style={[styles.plainButtonText, row.status === 'collected' && styles.plainButtonTextCollected]}>
              {buttonLabel}
            </Text>
          </Pressable>
        )}
        <View style={styles.rewardLabel}>
          <Text style={styles.rewardLabelText}>+{row.reward}</Text>
          <WaterDrop size={11} />
        </View>
      </View>
    </View>
  );
}

export function CrayonDailyDrops({ rows, allCollected, onCollect, onDailyBreadPress }: Props) {
  const [collapsed, setCollapsed] = useState(allCollected);

  useEffect(() => {
    if (allCollected) setCollapsed(true);
  }, [allCollected]);

  return (
    <CrayonCard>
      <Text style={styles.title}>Daily drops</Text>

      {collapsed ? (
        <Pressable style={styles.collapsedCard} onPress={() => setCollapsed(false)}>
          <Text style={styles.collapsedText}>All collected today ✓</Text>
        </Pressable>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => (
            <CrayonDailyDropRow key={row.key} row={row} onCollect={onCollect} onDailyBreadPress={onDailyBreadPress} />
          ))}
        </View>
      )}
    </CrayonCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 15,
    color: CRAYON_COLORS.textMuted,
    marginBottom: 10,
  },
  collapsedCard: {
    borderWidth: 2,
    borderColor: CRAYON_COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#EDF8E9',
    paddingVertical: 12,
    alignItems: 'center',
  },
  collapsedText: {
    fontFamily: CRAYON_FONTS.headingMedium,
    fontSize: 15,
    color: CRAYON_COLORS.success,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: CRAYON_COLORS.border,
    paddingBottom: 10,
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
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 16,
    color: CRAYON_COLORS.textPrimary,
  },
  rowVerse: {
    fontFamily: CRAYON_FONTS.serifItalic,
    fontSize: 11,
    color: CRAYON_COLORS.sage,
  },
  rowDescription: {
    marginTop: 2,
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 12,
    color: CRAYON_COLORS.textMuted,
  },
  rowAction: {
    alignItems: 'center',
    position: 'relative',
  },
  flourish: {
    position: 'absolute',
    top: -20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  flourishText: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 13,
    color: CRAYON_COLORS.success,
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  plainButton: {
    borderWidth: 2,
    borderColor: CRAYON_COLORS.border,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: CRAYON_COLORS.background,
    opacity: 0.6,
  },
  plainButtonCollected: {
    backgroundColor: '#EDF8E9',
    opacity: 1,
  },
  plainButtonText: {
    fontFamily: CRAYON_FONTS.headingMedium,
    fontSize: 13,
    color: CRAYON_COLORS.textMuted,
  },
  plainButtonTextCollected: {
    color: CRAYON_COLORS.success,
  },
  rewardLabel: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rewardLabelText: {
    fontFamily: CRAYON_FONTS.serif,
    fontSize: 11,
    color: CRAYON_COLORS.textMuted,
  },
});
