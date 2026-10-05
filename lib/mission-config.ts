// One place to tweak mission rewards and targets.
export type MilestoneKey =
  | 'first_checkin'
  | 'ten_chapters'
  | 'twentyfive_chapters'
  | 'fifty_chapters'
  | 'ten_reflections'
  | 'finish_a_book'
  | 'first_prayer';

export type MilestoneDef = {
  key: MilestoneKey;
  title: string;
  description: string;
  reward: number;
  target: number;
};

export const MILESTONES: MilestoneDef[] = [
  { key: 'first_checkin', title: 'First Steps', description: 'Check in for the first time.', reward: 10, target: 1 },
  { key: 'ten_chapters', title: 'Ten Chapters', description: 'Read 10 chapters, in any group.', reward: 20, target: 10 },
  {
    key: 'twentyfive_chapters',
    title: 'Quarter Century',
    description: 'Read 25 chapters, in any group.',
    reward: 40,
    target: 25,
  },
  {
    key: 'fifty_chapters',
    title: 'Half Century',
    description: 'Read 50 chapters, in any group.',
    reward: 75,
    target: 50,
  },
  { key: 'ten_reflections', title: 'Reflective Heart', description: 'Post 10 reflections.', reward: 20, target: 10 },
  {
    key: 'finish_a_book',
    title: 'Well Done',
    description: 'Finish reading a whole book, start to end.',
    reward: 50,
    target: 1,
  },
  { key: 'first_prayer', title: 'Prayer Warrior', description: 'Share your first prayer request.', reward: 10, target: 1 },
];

export const WEEKLY_MISSION = {
  key: 'week',
  title: 'Reading Week',
  description: 'Read on 5 days this week.',
  reward: 15,
  targetDays: 5,
};

export const MONTHLY_MISSION = {
  key: 'month',
  title: 'Reading Month',
  description: 'Read on 15 days this month.',
  reward: 30,
  targetDays: 15,
};
