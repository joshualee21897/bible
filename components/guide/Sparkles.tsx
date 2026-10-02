import { StyleSheet, Text, View } from 'react-native';

// A few small pixel sparkles for celebration moments (tree grew a stage,
// weekly goal hit, after checking in). Purely decorative.
const SPARKLE_SPOTS = [
  { top: -6, left: -10, size: 12, delay: 0 },
  { top: -14, left: 14, size: 9, delay: 1 },
  { top: 4, left: 30, size: 7, delay: 2 },
];

export function Sparkles() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      {SPARKLE_SPOTS.map((spot, index) => (
        <Text
          key={index}
          style={[styles.sparkle, { top: spot.top, left: spot.left, fontSize: spot.size }]}
        >
          ✦
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute',
    color: '#F6D9A0',
  },
});
