export type TreeStage = 'seed' | 'sprout' | 'sapling' | 'tree' | 'fruiting';

const STAGE_THRESHOLDS: { stage: TreeStage; minCheckins: number; label: string }[] = [
  { stage: 'fruiting', minCheckins: 50, label: 'Fruit-bearing tree' },
  { stage: 'tree', minCheckins: 25, label: 'Tree' },
  { stage: 'sapling', minCheckins: 10, label: 'Sapling' },
  { stage: 'sprout', minCheckins: 3, label: 'Sprout' },
  { stage: 'seed', minCheckins: 0, label: 'Seed' },
];

export function getTreeStage(checkinCount: number): TreeStage {
  const match = STAGE_THRESHOLDS.find((entry) => checkinCount >= entry.minCheckins);
  return match?.stage ?? 'seed';
}

export function getTreeStageLabel(stage: TreeStage): string {
  return STAGE_THRESHOLDS.find((entry) => entry.stage === stage)?.label ?? 'Seed';
}
