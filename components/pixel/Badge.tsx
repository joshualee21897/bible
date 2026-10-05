import { useMemo } from 'react';

import { PixelGrid } from './PixelGrid';
import { buildBadgeGrid, type BadgeTier } from './badge-sprites';

type Props = {
  tier: BadgeTier;
  achieved?: boolean;
  pixelSize?: number;
};

export function Badge({ tier, achieved = true, pixelSize = 3 }: Props) {
  const grid = useMemo(() => buildBadgeGrid(tier, achieved), [tier, achieved]);
  return <PixelGrid grid={grid} pixelSize={pixelSize} />;
}
