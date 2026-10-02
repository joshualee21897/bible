import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Tree } from '../components/pixel/Tree';
import { COLORS, FONTS } from '../components/theme';
import type { TreeStage } from '../lib/tree';

const STAGES: TreeStage[] = ['seed', 'sprout', 'sapling', 'tree', 'fruiting'];
const FRAME_MS = 400;
const FINAL_HOLD_MS = 700;

export default function SplashGate() {
  const [stageIndex, setStageIndex] = useState(0);
  const treeFade = useRef(new Animated.Value(1)).current;
  const titleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isLastStage = stageIndex === STAGES.length - 1;

    if (isLastStage) {
      Animated.timing(titleFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      const timeout = setTimeout(() => router.replace('/today'), FINAL_HOLD_MS);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setStageIndex((index) => index + 1);
      Animated.sequence([
        Animated.timing(treeFade, { toValue: 0, duration: 110, useNativeDriver: true }),
        Animated.timing(treeFade, { toValue: 1, duration: 110, useNativeDriver: true }),
      ]).start();
    }, FRAME_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIndex]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: treeFade }}>
        <Tree stage={STAGES[stageIndex]} pixelSize={5} />
      </Animated.View>
      <Animated.View style={[styles.titleBlock, { opacity: titleFade }]}>
        <Text style={styles.title}>Sprout</Text>
        <Text style={styles.subtitle}>Small seeds. Growing together.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
