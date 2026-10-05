import { Path, Svg } from 'react-native-svg';

import { CRAYON_COLORS } from '../../lib/theme-crayon';

type Props = { size?: number };

// A tiny hand-drawn sprout — stands in for the 🌱 emoji on a completed day.
export function Sprout({ size = 16 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 22 V12" stroke={CRAYON_COLORS.ink} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M12 13 C12 13 6 12 6 6 C12 6 13 11 12 13 Z"
        fill={CRAYON_COLORS.sage}
        stroke={CRAYON_COLORS.ink}
        strokeWidth={1.4}
      />
      <Path
        d="M12 15 C12 15 18 14 18 8 C12 8 11 13 12 15 Z"
        fill={CRAYON_COLORS.sage}
        stroke={CRAYON_COLORS.ink}
        strokeWidth={1.4}
      />
    </Svg>
  );
}
