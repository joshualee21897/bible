import { useMemo } from 'react';

import type { TreeStage } from '../../lib/tree';
import { PixelGrid } from './PixelGrid';
import { buildTreeGrid } from './tree-sprites';

type Props = {
  stage: TreeStage;
  resting?: boolean;
  pixelSize?: number;
};

export function Tree({ stage, resting = false, pixelSize = 4 }: Props) {
  const grid = useMemo(() => buildTreeGrid(stage, resting), [stage, resting]);
  return <PixelGrid grid={grid} pixelSize={pixelSize} />;
}
