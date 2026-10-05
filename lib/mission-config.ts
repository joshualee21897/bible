import { BIBLE_BOOKS } from './bible-books';

// One place to tweak mission titles, verses, rewards, and targets.
export type MissionSection = 'period' | 'reading' | 'books' | 'community' | 'garden' | 'grace';

// The "Daily drops" checklist on the Today tab — a fresh set of small,
// once-a-day tasks, separate from the Missions tab's weekly/monthly and
// lifetime missions below.
export type DailyDropKey =
  | 'morning_manna'
  | 'daily_bread'
  | 'iron_sharpens_iron'
  | 'second_mile'
  | 'stand_in_the_gap';

export type DailyDropDef = {
  key: DailyDropKey;
  title: string;
  verse: string;
  description: string;
  reward: number;
};

export const DAILY_DROPS: DailyDropDef[] = [
  {
    key: 'morning_manna',
    title: 'Morning Manna',
    verse: 'Lamentations 3:23',
    description: 'Open Sprout today.',
    reward: 2,
  },
  {
    key: 'daily_bread',
    title: 'Daily Bread',
    verse: 'Matthew 6:11',
    description: 'Check in with a reflection today.',
    reward: 10,
  },
  {
    key: 'iron_sharpens_iron',
    title: 'Iron Sharpens Iron',
    verse: 'Proverbs 27:17',
    description: "Tap Amen on someone's reflection today.",
    reward: 2,
  },
  {
    key: 'second_mile',
    title: 'The Second Mile',
    verse: 'Matthew 5:41',
    description: 'Read 2 or more chapters today (catch-up counts).',
    reward: 5,
  },
  {
    key: 'stand_in_the_gap',
    title: 'Stand in the Gap',
    verse: 'Ezekiel 22:30',
    description: 'Tap "Praying for you" on a prayer request today.',
    reward: 2,
  },
];

export type CountMetric =
  | 'totalCheckins'
  | 'reflections'
  | 'prayersShared'
  | 'amensGiven'
  | 'prayingTaps'
  | 'prayersAnswered'
  | 'largestGroupMemberCount'
  | 'animalsBought'
  | 'beforeNineDays'
  | 'sundaysRead'
  | 'distinctDaysRead'
  | 'finishedBooksCount';

export type CountMissionDef = {
  kind: 'count';
  key: string;
  section: MissionSection;
  title: string;
  verse: string;
  description: string;
  reward: number;
  target: number;
  metric: CountMetric;
};

export type BooksMissionDef = {
  kind: 'books';
  key: string;
  section: MissionSection;
  title: string;
  verse: string;
  description: string;
  reward: number;
  books: string[];
};

export type RepeatableMissionDef = {
  kind: 'repeatable';
  key: string;
  section: MissionSection;
  title: string;
  verse: string;
  description: string;
  reward: number;
};

export type PeriodMissionDef = {
  kind: 'period';
  key: string;
  section: 'period';
  title: string;
  verse: string;
  description: string;
  reward: number;
  targetDays: number;
  period: 'week' | 'month';
};

export type MissionDef = CountMissionDef | BooksMissionDef | RepeatableMissionDef | PeriodMissionDef;

function bookRange(startName: string, endName: string): string[] {
  const names = BIBLE_BOOKS.map((b) => b.name);
  const start = names.indexOf(startName);
  const end = names.indexOf(endName);
  return names.slice(start, end + 1);
}

export const PENTATEUCH = bookRange('Genesis', 'Deuteronomy');
export const GOSPELS = bookRange('Matthew', 'John');
export const NEW_TESTAMENT = bookRange('Matthew', 'Revelation');
export const WHOLE_BIBLE = BIBLE_BOOKS.map((b) => b.name);

export const PERIOD_MISSIONS: PeriodMissionDef[] = [
  {
    kind: 'period',
    key: 'daily_bread',
    section: 'period',
    title: 'Daily Bread',
    verse: 'Matthew 6:11',
    description: 'Read on 5 days this week.',
    reward: 15,
    targetDays: 5,
    period: 'week',
  },
  {
    kind: 'period',
    key: 'manna_month',
    section: 'period',
    title: 'Manna Month',
    verse: 'Exodus 16:35',
    description: 'Read on 15 days this month.',
    reward: 30,
    targetDays: 15,
    period: 'month',
  },
];

export const READING_MISSIONS: CountMissionDef[] = [
  {
    kind: 'count',
    key: 'mustard_seed',
    section: 'reading',
    title: 'Mustard Seed',
    verse: 'Matthew 17:20',
    description: 'Check in for the first time.',
    reward: 10,
    target: 1,
    metric: 'totalCheckins',
  },
  {
    kind: 'count',
    key: 'ten_talents',
    section: 'reading',
    title: 'Ten Talents',
    verse: 'Matthew 25:28',
    description: 'Read 10 chapters.',
    reward: 20,
    target: 10,
    metric: 'totalCheckins',
  },
  {
    kind: 'count',
    key: 'twelve_tribes',
    section: 'reading',
    title: 'Twelve Tribes',
    verse: 'Genesis 49:28',
    description: 'Read 25 chapters.',
    reward: 40,
    target: 25,
    metric: 'totalCheckins',
  },
  {
    kind: 'count',
    key: 'year_of_jubilee',
    section: 'reading',
    title: 'Year of Jubilee',
    verse: 'Leviticus 25:11',
    description: 'Read 50 chapters.',
    reward: 75,
    target: 50,
    metric: 'totalCheckins',
  },
  {
    kind: 'count',
    key: 'morning_by_morning',
    section: 'reading',
    title: 'Morning by Morning',
    verse: 'Psalm 5:3',
    description: 'Read before 9am on 5 days.',
    reward: 20,
    target: 5,
    metric: 'beforeNineDays',
  },
  {
    kind: 'count',
    key: 'the_lords_day',
    section: 'reading',
    title: "The Lord's Day",
    verse: 'Revelation 1:10',
    description: 'Read on 4 Sundays.',
    reward: 20,
    target: 4,
    metric: 'sundaysRead',
  },
  {
    kind: 'count',
    key: 'forty_days',
    section: 'reading',
    title: 'Forty Days',
    verse: 'Matthew 4:2',
    description: 'Read on 40 different days.',
    reward: 60,
    target: 40,
    metric: 'distinctDaysRead',
  },
  {
    kind: 'count',
    key: 'seventy_times_seven',
    section: 'reading',
    title: 'Seventy Times Seven',
    verse: 'Matthew 18:22',
    description: 'Read 490 chapters.',
    reward: 300,
    target: 490,
    metric: 'totalCheckins',
  },
];

export const BOOK_MISSIONS: (CountMissionDef | BooksMissionDef)[] = [
  {
    kind: 'count',
    key: 'good_and_faithful_servant',
    section: 'books',
    title: 'Good and Faithful Servant',
    verse: 'Matthew 25:21',
    description: 'Finish your first book.',
    reward: 50,
    target: 1,
    metric: 'finishedBooksCount',
  },
  {
    kind: 'count',
    key: 'faithful_in_little',
    section: 'books',
    title: 'Faithful in Little',
    verse: 'Luke 16:10',
    description: 'Finish 3 books.',
    reward: 80,
    target: 3,
    metric: 'finishedBooksCount',
  },
  {
    kind: 'count',
    key: 'seven_lampstands',
    section: 'books',
    title: 'Seven Lampstands',
    verse: 'Revelation 1:12',
    description: 'Finish 7 books.',
    reward: 120,
    target: 7,
    metric: 'finishedBooksCount',
  },
  {
    kind: 'books',
    key: 'wisdom_seeker',
    section: 'books',
    title: 'Wisdom Seeker',
    verse: 'Proverbs 4:7',
    description: 'Finish Proverbs.',
    reward: 60,
    books: ['Proverbs'],
  },
  {
    kind: 'books',
    key: 'gospel_road',
    section: 'books',
    title: 'Gospel Road',
    verse: 'Mark 16:15',
    description: 'Finish Matthew, Mark, Luke, and John.',
    reward: 100,
    books: GOSPELS,
  },
  {
    kind: 'books',
    key: 'song_for_every_season',
    section: 'books',
    title: 'A Song for Every Season',
    verse: 'Psalm 150:6',
    description: 'Finish Psalms.',
    reward: 150,
    books: ['Psalms'],
  },
  {
    kind: 'books',
    key: 'law_of_moses',
    section: 'books',
    title: 'The Law of Moses',
    verse: 'Joshua 1:8',
    description: 'Finish Genesis, Exodus, Leviticus, Numbers, and Deuteronomy.',
    reward: 150,
    books: PENTATEUCH,
  },
  {
    kind: 'books',
    key: 'every_word',
    section: 'books',
    title: 'Every Word',
    verse: 'Matthew 4:4',
    description: 'Finish the whole New Testament.',
    reward: 300,
    books: NEW_TESTAMENT,
  },
  {
    kind: 'books',
    key: 'alpha_and_omega',
    section: 'books',
    title: 'Alpha and Omega',
    verse: 'Revelation 22:13',
    description: 'Finish the whole Bible.',
    reward: 1000,
    books: WHOLE_BIBLE,
  },
];

export const COMMUNITY_MISSIONS: CountMissionDef[] = [
  {
    kind: 'count',
    key: 'ask_seek_knock',
    section: 'community',
    title: 'Ask, Seek, Knock',
    verse: 'Matthew 7:7',
    description: 'Share your first prayer request.',
    reward: 10,
    target: 1,
    metric: 'prayersShared',
  },
  {
    kind: 'count',
    key: 'iron_sharpens_iron',
    section: 'community',
    title: 'Iron Sharpens Iron',
    verse: 'Proverbs 27:17',
    description: 'Give 10 Amens.',
    reward: 10,
    target: 10,
    metric: 'amensGiven',
  },
  {
    kind: 'count',
    key: 'bear_one_anothers_burdens',
    section: 'community',
    title: "Bear One Another's Burdens",
    verse: 'Galatians 6:2',
    description: 'Tap "Praying for you" on 10 prayer requests.',
    reward: 15,
    target: 10,
    metric: 'prayingTaps',
  },
  {
    kind: 'count',
    key: 'ebenezer',
    section: 'community',
    title: 'Ebenezer',
    verse: '1 Samuel 7:12',
    description: 'Mark one of your prayers as answered.',
    reward: 15,
    target: 1,
    metric: 'prayersAnswered',
  },
  {
    kind: 'count',
    key: 'two_or_three_gathered',
    section: 'community',
    title: 'Two or Three Gathered',
    verse: 'Matthew 18:20',
    description: 'Be in a group with 3 or more members.',
    reward: 10,
    target: 3,
    metric: 'largestGroupMemberCount',
  },
];

export const GARDEN_MISSIONS: CountMissionDef[] = [
  {
    kind: 'count',
    key: 'two_by_two',
    section: 'garden',
    title: 'Two by Two',
    verse: 'Genesis 7:9',
    description: 'Add 2 animals to any garden.',
    reward: 10,
    target: 2,
    metric: 'animalsBought',
  },
];

export const GRACE_MISSIONS: RepeatableMissionDef[] = [
  {
    kind: 'repeatable',
    key: 'prodigal_returns',
    section: 'grace',
    title: 'The Prodigal Returns',
    verse: 'Luke 15:20',
    description: 'Check in after resting for 7 or more days. Can be earned again each time.',
    reward: 20,
  },
];

export const ALL_MISSIONS: MissionDef[] = [
  ...PERIOD_MISSIONS,
  ...READING_MISSIONS,
  ...BOOK_MISSIONS,
  ...COMMUNITY_MISSIONS,
  ...GARDEN_MISSIONS,
  ...GRACE_MISSIONS,
];

export const SECTION_LABELS: Record<MissionSection, string> = {
  period: 'This week & month',
  reading: 'Reading',
  books: 'Finishing books',
  community: 'Community',
  garden: 'Garden',
  grace: 'Grace',
};

export const SECTION_ORDER: MissionSection[] = ['period', 'reading', 'books', 'community', 'garden', 'grace'];
