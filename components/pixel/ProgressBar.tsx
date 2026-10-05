import { StyleSheet, View } from 'react-native';

import { COLORS } from '../theme';
import { PALETTE } from './palette';

type Props = {
  percent: number;
  segments?: number;
  // When set, fills exactly this many segments instead of rounding from
  // percent — use this whenever each segment represents a countable thing
  // (e.g. one chapter) so the empty segments always match "X more to go".
  filled?: number;
};

export function ProgressBar({ percent, segments = 10, filled }: Props) {
  const filledCount = filled ?? Math.round((Math.min(100, Math.max(0, percent)) / 100) * segments);

  return (
    <View style={styles.track}>
      {Array.from({ length: segments }, (_, index) => (
        <View key={index} style={[styles.segment, index < filledCount ? styles.filled : styles.empty]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: PALETTE.outline,
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  segment: {
    flex: 1,
    height: 16,
    borderRightWidth: 1,
    borderRightColor: PALETTE.outline,
  },
  filled: {
    backgroundColor: PALETTE.leavesDark,
  },
  empty: {
    backgroundColor: COLORS.surface,
  },
});
