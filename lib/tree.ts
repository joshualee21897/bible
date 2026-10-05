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

// How many more check-ins until the next stage, and what it's called —
// null once a tree has reached the last stage.
export function getNextStage(checkinCount: number): { label: string; remaining: number } | null {
  const next = [...STAGE_THRESHOLDS].reverse().find((entry) => checkinCount < entry.minCheckins);
  if (!next) return null;
  return { label: next.label, remaining: next.minCheckins - checkinCount };
}

// How far through the current stage a tree is, as a percent — the band runs
// from the threshold just reached up to the next one.
export function getStageProgressPercent(checkinCount: number): number {
  const ascending = [...STAGE_THRESHOLDS].reverse();
  const currentIndex = [...ascending].reverse().findIndex((entry) => checkinCount >= entry.minCheckins);
  const stageIndex = ascending.length - 1 - currentIndex;
  const lower = ascending[stageIndex].minCheckins;
  const next = ascending[stageIndex + 1];
  if (!next) return 100;
  return Math.min(100, Math.round(((checkinCount - lower) / (next.minCheckins - lower)) * 100));
}

// The progress bar toward the next stage, as whole chapters rather than a
// percent — so "2 more to grow" always matches exactly 2 empty boxes.
// null once a tree has reached the last stage (no next stage to show).
export function getStageSegments(checkinCount: number): { segments: number; filled: number } | null {
  const ascending = [...STAGE_THRESHOLDS].reverse();
  const stageIndex = ascending.findIndex((entry, index) => {
    const next = ascending[index + 1];
    return checkinCount >= entry.minCheckins && (!next || checkinCount < next.minCheckins);
  });
  const lower = ascending[stageIndex].minCheckins;
  const next = ascending[stageIndex + 1];
  if (!next) return null;
  return { segments: next.minCheckins - lower, filled: checkinCount - lower };
}

const RESTING_AFTER_DAYS = 3;

// A tree that hasn't grown yet (a seed) isn't "resting" — it just hasn't
// started. Resting only applies once someone has read at least once.
export function isTreeResting(lastCheckinAt: string | null, checkinCount: number): boolean {
  if (checkinCount === 0 || !lastCheckinAt) return false;
  const daysSinceLastCheckin = (Date.now() - new Date(lastCheckinAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastCheckin >= RESTING_AFTER_DAYS;
}
