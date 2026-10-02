// TEMPORARY — art direction preview only. Not linked from any nav, and
// removed once the new style is reviewed.
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PreviewPixelGrid } from '../components/pixel/preview/PreviewPixelGrid';
import { buildIsoGroundTile } from '../components/pixel/preview/iso-ground-tile';
import { buildFlatLamb } from '../components/pixel/preview/lamb-flat';

export default function ArtPreview() {
  const tile = buildIsoGroundTile();
  const lamb = buildFlatLamb();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>New art direction — proof of concept</Text>

      <View style={styles.stage}>
        <View style={styles.tileLayer}>
          <PreviewPixelGrid grid={tile} pixelSize={7} />
        </View>
        <View style={styles.lambLayer}>
          <PreviewPixelGrid grid={lamb} pixelSize={7} />
        </View>
      </View>

      <Text style={styles.caption}>Ground tile + lamb, standalone</Text>
      <View style={styles.row}>
        <PreviewPixelGrid grid={tile} pixelSize={5} />
        <View style={{ width: 24 }} />
        <PreviewPixelGrid grid={lamb} pixelSize={9} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  stage: {
    width: 36 * 7,
    height: 36 * 7,
  },
  tileLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  lambLayer: {
    position: 'absolute',
    top: 7 * 9,
    left: 7 * 10,
  },
  caption: {
    marginTop: 12,
    fontSize: 13,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
