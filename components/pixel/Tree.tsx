import { useMemo } from 'react';

import type { TreeStage } from '../../lib/tree';
import { PixelGrid } from './PixelGrid';
import { buildTreeGrid } from './tree-sprites';

type Props = {
  stage: TreeStage;
  pixelSize?: number;
};

export function Tree({ stage, pixelSize = 4 }: Props) {
  const grid = useMemo(() => buildTreeGrid(stage), [stage]);
  return <PixelGrid grid={grid} pixelSize={pixelSize} />;
}
