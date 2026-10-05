import { Path, Svg } from 'react-native-svg';

import { CRAYON_COLORS } from '../../lib/theme-crayon';

type Props = { size?: number };

// A simple hand-drawn line icon for the water drops currency.
export function WaterDrop({ size = 16 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2 C12 2 5 12.5 5 16.8 C5 20.4 8.1 23 12 23 C15.9 23 19 20.4 19 16.8 C19 12.5 12 2 12 2 Z"
        fill={CRAYON_COLORS.sky}
        stroke={CRAYON_COLORS.ink}
        strokeWidth={1.6}
      />
    </Svg>
  );
}
