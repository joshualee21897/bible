import { useId, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, FeDisplacementMap, FeTurbulence, Filter, Rect } from 'react-native-svg';

import { CRAYON_COLORS, CRAYON_FONTS } from '../../lib/theme-crayon';

export type CrayonTone = 'sage' | 'blush' | 'butter' | 'sky' | 'lavender';

const TONE_FILL: Record<CrayonTone, string> = {
  sage: CRAYON_COLORS.sage,
  blush: CRAYON_COLORS.blush,
  butter: CRAYON_COLORS.butter,
  sky: CRAYON_COLORS.sky,
  lavender: CRAYON_COLORS.lavender,
};

const TONE_FILL_PRESSED: Record<CrayonTone, string> = {
  sage: '#8FC07E',
  blush: '#E79D9D',
  butter: '#E6C878',
  sky: '#A9CFE8',
  lavender: '#BFA7E0',
};

type Props = {
  label: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  tone?: CrayonTone;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<ViewStyle>;
};

export function CrayonButton({ label, onPress, disabled, tone = 'sage', style, textStyle }: Props) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `crayon-btn-wobble-${rawId}`;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pressed, setPressed] = useState(false);

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }

  const fill = disabled ? CRAYON_COLORS.paper : pressed ? TONE_FILL_PRESSED[tone] : TONE_FILL[tone];

  return (
    <Pressable
      style={[styles.wrap, style]}
      onLayout={handleLayout}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      {size.width > 0 && size.height > 0 && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
              <FeTurbulence type="fractalNoise" baseFrequency={0.02} numOctaves={2} seed={7} result="noise" />
              <FeDisplacementMap in="SourceGraphic" in2="noise" scale={4} />
            </Filter>
          </Defs>
          <Rect
            x={2.5}
            y={2.5}
            width={Math.max(size.width - 5, 0)}
            height={Math.max(size.height - 5, 0)}
            rx={14}
            fill={fill}
            stroke={CRAYON_COLORS.ink}
            strokeWidth={2.2}
            filter={`url(#${filterId})`}
          />
        </Svg>
      )}
      <View style={styles.content}>
        {typeof label === 'string' ? (
          <Text style={[styles.text, disabled && styles.textDisabled, textStyle]}>{label}</Text>
        ) : (
          label
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'relative',
  },
  text: {
    fontFamily: CRAYON_FONTS.headingSemiBold,
    fontSize: 16,
    color: CRAYON_COLORS.textPrimary,
  },
  textDisabled: {
    color: CRAYON_COLORS.textMuted,
  },
});
