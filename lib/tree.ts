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

const RESTING_AFTER_DAYS = 3;

// A tree that hasn't grown yet (a seed) isn't "resting" — it just hasn't
// started. Resting only applies once someone has read at least once.
export function isTreeResting(lastCheckinAt: string | null, checkinCount: number): boolean {
  if (checkinCount === 0 || !lastCheckinAt) return false;
  const daysSinceLastCheckin = (Date.now() - new Date(lastCheckinAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastCheckin >= RESTING_AFTER_DAYS;
}
