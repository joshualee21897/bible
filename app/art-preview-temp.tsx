// TEMPORARY — art direction preview only. Not linked from any nav, and
// removed once the new style is reviewed.
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PreviewPixelGrid } from '../components/pixel/preview/PreviewPixelGrid';
import { buildIsoGroundTile } from '../components/pixel/preview/iso-ground-tile';
import { buildReferenceLamb } from '../components/pixel/preview/lamb-reference';

export default function ArtPreview() {
  const tile = buildIsoGroundTile();
  const refLamb = buildReferenceLamb();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>New art direction — v3 (exact reference port)</Text>

      <Text style={styles.caption}>Reference sheep, ported pixel-for-pixel</Text>
      <PreviewPixelGrid grid={refLamb} pixelSize={10} />

      <Text style={styles.caption}>On the ground tile</Text>
      <View style={styles.stage}>
        <View style={styles.tileLayer}>
          <PreviewPixelGrid grid={tile} pixelSize={7} />
        </View>
        <View style={styles.lambLayer}>
          <PreviewPixelGrid grid={refLamb} pixelSize={6} />
        </View>
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
    top: 7 * 10,
    left: 7 * 8,
  },
  caption: {
    marginTop: 12,
    fontSize: 13,
    color: '#666',
  },
});
