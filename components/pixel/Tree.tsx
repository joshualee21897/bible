import { useMemo } from 'react';

import type { TreeStage } from '../../lib/tree';
import { PixelGrid } from './PixelGrid';
import { buildTreeGrid } from './tree-sprites';

type Props = {
  stage: TreeStage;
  resting?: boolean;
  pixelSize?: number;
  showGround?: boolean;
};

export function Tree({ stage, resting = false, pixelSize = 4, showGround = true }: Props) {
  const grid = useMemo(() => buildTreeGrid(stage, resting, showGround), [stage, resting, showGround]);
  return <PixelGrid grid={grid} pixelSize={pixelSize} />;
}
