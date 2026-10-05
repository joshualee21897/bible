import { Circle, Path, Svg } from 'react-native-svg';

import { CRAYON_COLORS } from '../../lib/theme-crayon';

type Props = { size?: number };

// A simple hand-drawn line icon for Settings.
export function Gear({ size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3.2} fill="none" stroke={CRAYON_COLORS.ink} strokeWidth={1.8} />
      <Path
        d="M12 3 L12.8 6.2 M12 21 L11.2 17.8 M3 12 L6.2 11.2 M21 12 L17.8 12.8 M5.5 5.5 L7.8 7.8 M18.5 18.5 L16.2 16.2 M5.5 18.5 L7.8 16.2 M18.5 5.5 L16.2 7.8"
        stroke={CRAYON_COLORS.ink}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
