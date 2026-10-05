import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { GardenLevelDef } from '../../lib/garden-levels';
import { Sparkles } from '../guide/Sparkles';
import { Lamb } from '../pixel/Lamb';
import { buttonBase, COLORS, FONTS, HARD_SHADOW } from '../theme';

type Props = {
  level: GardenLevelDef | null;
  onDismiss: () => void;
};

// A full-screen moment shown once per group per level, the next time
// someone opens the Garden tab after the Storehouse crosses a threshold.
export function LevelUpCelebration({ level, onDismiss }: Props) {
  const hop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!level) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hop, { toValue: -10, duration: 260, useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.delay(350),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [level, hop]);

  if (!level) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.lambWrap}>
            <Animated.View style={{ transform: [{ translateY: hop }] }}>
              <Lamb mood="happy" pixelSize={6} />
            </Animated.View>
            <Sparkles />
          </View>
          <Text style={styles.heading}>Our garden grew into a {level.name}!</Text>
          <Text style={styles.verse}>{level.verse}</Text>
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Amen</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(74, 63, 53, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    ...HARD_SHADOW,
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  lambWrap: {
    marginBottom: 6,
    position: 'relative',
  },
  heading: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  verse: {
    fontFamily: FONTS.serifItalic,
    fontSize: 14,
    color: COLORS.sageDark,
    textAlign: 'center',
  },
  button: {
    ...buttonBase,
    marginTop: 10,
    backgroundColor: COLORS.sage,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
});
