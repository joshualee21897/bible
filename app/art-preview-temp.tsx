// TEMPORARY — art direction preview only. Not linked from any nav, and
// removed once the new style is reviewed.
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PixelGrid } from '../components/pixel/PixelGrid';
import { buildTreeGrid } from '../components/pixel/tree-sprites';
import { Lamb } from '../components/pixel/Lamb';
import type { TreeStage } from '../lib/tree';

const STAGES: TreeStage[] = ['seed', 'sprout', 'sapling', 'tree', 'fruiting'];

export default function ArtPreview() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tree stages — new flat style</Text>

      <View style={styles.row}>
        {STAGES.map((stage) => (
          <View key={stage} style={styles.item}>
            <PixelGrid grid={buildTreeGrid(stage)} pixelSize={4} />
            <Text style={styles.label}>{stage}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.title}>Resting variants</Text>
      <View style={styles.row}>
        {STAGES.map((stage) => (
          <View key={stage} style={styles.item}>
            <PixelGrid grid={buildTreeGrid(stage, true)} pixelSize={4} />
            <Text style={styles.label}>{stage}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.title}>Lamb moods</Text>
      <View style={styles.row}>
        {(['happy', 'waving', 'pointing', 'sleeping'] as const).map((mood) => (
          <View key={mood} style={styles.item}>
            <Lamb mood={mood} pixelSize={5} />
            <Text style={styles.label}>{mood}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  item: {
    alignItems: 'center',
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
});
