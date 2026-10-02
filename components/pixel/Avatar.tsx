import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../theme';

type Props = {
  color: string;
  name: string;
  size?: number;
};

export function Avatar({ color, name, size = 42 }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.box, { width: size, height: size, backgroundColor: color }]}>
      <Text style={[styles.letter, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textPrimary,
  },
});
