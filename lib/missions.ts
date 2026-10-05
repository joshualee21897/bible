import { getChapterCount } from './bible-books';
import { MILESTONES, MONTHLY_MISSION, WEEKLY_MISSION, type MilestoneKey } from './mission-config';
import { supabase } from './supabase';
import { startOfWeek } from './weekly-goal';

export type MissionProgress = {
  key: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  achieved: boolean;
  daysLeft?: number;
};

export type MissionSummary = {
  periodMissions: MissionProgress[];
  milestones: MissionProgress[];
  bonusDropsEarned: number;
};

type CheckinRow = { group_id: string; book: string; chapter: number; reflection: string | null; created_at: string };

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysUntil(end: Date, now: Date): number {
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// A book only counts as finished if every chapter 1..N has been checked in —
// not just that enough days have passed since the group's start date.
function countBookFinishes(checkins: CheckinRow[]): number {
  const byGroupBook = new Map<string, Set<number>>();
  for (const row of checkins) {
    const key = `${row.group_id}|${row.book}`;
    const set = byGroupBook.get(key) ?? new Set<number>();
    set.add(row.chapter);
    byGroupBook.set(key, set);
  }

  let finishes = 0;
  for (const [key, chapters] of byGroupBook) {
    const book = key.split('|')[1];
    let maxChapter: number;
    try {
      maxChapter = getChapterCount(book);
    } catch {
      continue;
    }
    let complete = true;
    for (let c = 1; c <= maxChapter; c++) {
      if (!chapters.has(c)) {
        complete = false;
        break;
      }
    }
    if (complete) finishes++;
  }
  return finishes;
}

// Counts how many past weeks/months (including the current one) already hit
// the reading-days target, so the bonus from a week that has since ended
// stays earned forever rather than disappearing once the week is over.
function countQualifyingPeriods(checkins: CheckinRow[], targetDays: number, keyFor: (date: Date) => string): number {
  const byPeriod = new Map<string, Set<string>>();
  for (const row of checkins) {
    const date = new Date(row.created_at);
    const periodKey = keyFor(date);
    const dayKey = row.created_at.slice(0, 10);
    const set = byPeriod.get(periodKey) ?? new Set<string>();
    set.add(dayKey);
    byPeriod.set(periodKey, set);
  }
  let count = 0;
  for (const days of byPeriod.values()) {
    if (days.size >= targetDays) count++;
  }
  return count;
}

export async function getMissionSummary(): Promise<MissionSummary> {
  const userId = await requireUserId();

  const [checkinsResult, prayersResult] = await Promise.all([
    supabase.from('checkins').select('group_id, book, chapter, reflection, created_at').eq('user_id', userId),
    supabase.from('prayers').select('id').eq('user_id', userId),
  ]);

  if (checkinsResult.error) throw checkinsResult.error;
  if (prayersResult.error) throw prayersResult.error;

  const checkins = (checkinsResult.data ?? []) as CheckinRow[];
  const prayerCount = prayersResult.data?.length ?? 0;

  const totalCheckins = checkins.length;
  const reflectionCount = checkins.filter((c) => c.reflection).length;
  const bookFinishes = countBookFinishes(checkins);

  const milestoneStats: Record<MilestoneKey, number> = {
    first_checkin: totalCheckins,
    ten_chapters: totalCheckins,
    twentyfive_chapters: totalCheckins,
    fifty_chapters: totalCheckins,
    ten_reflections: reflectionCount,
    finish_a_book: bookFinishes,
    first_prayer: prayerCount,
  };

  const milestones: MissionProgress[] = MILESTONES.map((def) => {
    const progress = Math.min(def.target, milestoneStats[def.key] ?? 0);
    return {
      key: def.key,
      title: def.title,
      description: def.description,
      reward: def.reward,
      progress,
      target: def.target,
      achieved: progress >= def.target,
    };
  });

  const bonusFromMilestones = milestones.reduce((total, m) => total + (m.achieved ? m.reward : 0), 0);
  const bonusFromWeeks =
    countQualifyingPeriods(checkins, WEEKLY_MISSION.targetDays, (d) => startOfWeek(d).toISOString().slice(0, 10)) *
    WEEKLY_MISSION.reward;
  const bonusFromMonths =
    countQualifyingPeriods(checkins, MONTHLY_MISSION.targetDays, (d) => `${d.getFullYear()}-${d.getMonth()}`) *
    MONTHLY_MISSION.reward;

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const daysReadThisWeek = new Set(
    checkins.filter((c) => new Date(c.created_at) >= weekStart).map((c) => c.created_at.slice(0, 10))
  ).size;

  const monthStart = startOfMonth(now);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const daysReadThisMonth = new Set(
    checkins.filter((c) => new Date(c.created_at) >= monthStart).map((c) => c.created_at.slice(0, 10))
  ).size;

  const periodMissions: MissionProgress[] = [
    {
      key: WEEKLY_MISSION.key,
      title: WEEKLY_MISSION.title,
      description: WEEKLY_MISSION.description,
      reward: WEEKLY_MISSION.reward,
      progress: Math.min(WEEKLY_MISSION.targetDays, daysReadThisWeek),
      target: WEEKLY_MISSION.targetDays,
      achieved: daysReadThisWeek >= WEEKLY_MISSION.targetDays,
      daysLeft: daysUntil(weekEnd, now),
    },
    {
      key: MONTHLY_MISSION.key,
      title: MONTHLY_MISSION.title,
      description: MONTHLY_MISSION.description,
      reward: MONTHLY_MISSION.reward,
      progress: Math.min(MONTHLY_MISSION.targetDays, daysReadThisMonth),
      target: MONTHLY_MISSION.targetDays,
      achieved: daysReadThisMonth >= MONTHLY_MISSION.targetDays,
      daysLeft: daysUntil(monthEnd, now),
    },
  ];

  return {
    periodMissions,
    milestones,
    bonusDropsEarned: bonusFromMilestones + bonusFromWeeks + bonusFromMonths,
  };
}
