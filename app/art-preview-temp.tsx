// TEMPORARY — art direction preview only. Not linked from any nav, and
// removed once the new style is reviewed.
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PixelGrid } from '../components/pixel/PixelGrid';
import { buildAnimalGrid, type AnimalKey } from '../components/pixel/animal-sprites';
import { buildDecorationGrid, type DecorationKey } from '../components/pixel/item-sprites';

const ANIMALS: AnimalKey[] = ['dove', 'sparrow', 'fish', 'raven', 'donkey', 'eagle', 'lion'];
const ITEMS: DecorationKey[] = ['well', 'bench', 'fence', 'lanterns'];

export default function ArtPreview() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Shop animals — new flat style</Text>
      <View style={styles.row}>
        {ANIMALS.map((key) => (
          <View key={key} style={styles.item}>
            <PixelGrid grid={buildAnimalGrid(key)} pixelSize={5} />
            <Text style={styles.label}>{key}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.title}>Garden items (unchanged style, new outline color)</Text>
      <View style={styles.row}>
        {ITEMS.map((key) => (
          <View key={key} style={styles.item}>
            <PixelGrid grid={buildDecorationGrid(key)} pixelSize={5} />
            <Text style={styles.label}>{key}</Text>
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
