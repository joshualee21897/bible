import { StyleSheet, View } from 'react-native';

import { PREVIEW_PALETTE } from './preview-palette';
import type { PreviewGridData } from './preview-types';

type Props = {
  grid: PreviewGridData;
  pixelSize?: number;
};

export function PreviewPixelGrid({ grid, pixelSize = 6 }: Props) {
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
                backgroundColor: cell ? PREVIEW_PALETTE[cell] : 'transparent',
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
