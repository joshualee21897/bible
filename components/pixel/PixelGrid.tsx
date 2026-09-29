import { StyleSheet, View } from 'react-native';

import { PALETTE } from './palette';
import type { PixelGridData } from './types';

type Props = {
  grid: PixelGridData;
  pixelSize?: number;
};

export function PixelGrid({ grid, pixelSize = 4 }: Props) {
  return (
    <View style={styles.container}>
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, cellIndex) => (
            <View
              key={cellIndex}
              style={{
                width: pixelSize,
                height: pixelSize,
                backgroundColor: cell ? PALETTE[cell] : 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
  },
});
