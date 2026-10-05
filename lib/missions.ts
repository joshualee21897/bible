import { getChapterCount } from './bible-books';
import { getGardenItem } from './garden-items';
import {
  ALL_MISSIONS,
  SECTION_ORDER,
  type CountMetric,
  type MissionSection,
} from './mission-config';
import { supabase } from './supabase';
import { startOfWeek } from './weekly-goal';

export type MissionProgress = {
  key: string;
  section: MissionSection;
  title: string;
  verse: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  achieved: boolean;
  daysLeft?: number;
  repeatable?: boolean;
  timesEarned?: number;
  bookNames?: string[];
  booksDone?: string[];
};

export type MissionSummary = {
  sections: { section: MissionSection; missions: MissionProgress[] }[];
  bonusDropsEarned: number;
};

type CheckinRow = { group_id: string; book: string; chapter: number; reflection: string | null; kind: string; created_at: string };

const REST_DAYS_FOR_COMEBACK = 7;

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

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

// A book counts as finished once every chapter 1..N has been checked in,
// combining check-ins from every group (same book, any group, any order).
function computeFinishedBooks(checkins: CheckinRow[]): Set<string> {
  const byBook = new Map<string, Set<number>>();
  for (const row of checkins) {
    const set = byBook.get(row.book) ?? new Set<number>();
    set.add(row.chapter);
    byBook.set(row.book, set);
  }

  const finished = new Set<string>();
  for (const [book, chapters] of byBook) {
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
    if (complete) finished.add(book);
  }
  return finished;
}

// How many times a check-in followed a gap of 7+ days since the previous
// check-in in that same group — each one is a fresh "welcome back" moment,
// so it can be earned again and again rather than just once.
function countComebacks(checkins: CheckinRow[]): number {
  const daysByGroup = new Map<string, Set<string>>();
  for (const row of checkins) {
    const set = daysByGroup.get(row.group_id) ?? new Set<string>();
    set.add(dayKey(row.created_at));
    daysByGroup.set(row.group_id, set);
  }

  let comebacks = 0;
  for (const days of daysByGroup.values()) {
    const sorted = [...days].sort();
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const gapDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (gapDays >= REST_DAYS_FOR_COMEBACK) comebacks++;
    }
  }
  return comebacks;
}

async function getLargestGroupMemberCount(userId: string): Promise<number> {
  const { data: myGroups, error: myGroupsError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  if (myGroupsError) throw myGroupsError;

  const groupIds = (myGroups ?? []).map((row) => row.group_id);
  if (groupIds.length === 0) return 0;

  const { data: allMembers, error: allMembersError } = await supabase
    .from('group_members')
    .select('group_id')
    .in('group_id', groupIds);
  if (allMembersError) throw allMembersError;

  const counts = new Map<string, number>();
  for (const row of allMembers ?? []) {
    counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

export async function getMissionSummary(): Promise<MissionSummary> {
  const userId = await requireUserId();

  const [checkinsResult, prayersResult, reactionsResult, animalsResult, largestGroupMemberCount] = await Promise.all([
    supabase.from('checkins').select('group_id, book, chapter, reflection, kind, created_at').eq('user_id', userId),
    supabase.from('prayers').select('answered').eq('user_id', userId),
    supabase.from('reactions').select('target_type').eq('user_id', userId),
    supabase.from('group_items').select('item_key').eq('bought_by', userId),
    getLargestGroupMemberCount(userId),
  ]);

  if (checkinsResult.error) throw checkinsResult.error;
  if (prayersResult.error) throw prayersResult.error;
  if (reactionsResult.error) throw reactionsResult.error;
  if (animalsResult.error) throw animalsResult.error;

  const checkins = (checkinsResult.data ?? []) as CheckinRow[];
  const prayers = prayersResult.data ?? [];
  const reactions = reactionsResult.data ?? [];

  const totalCheckins = checkins.length;
  const reflectionCount = checkins.filter((c) => c.reflection).length;
  const actionCheckinCount = checkins.filter((c) => c.kind === 'action').length;
  const revelationCheckinCount = checkins.filter((c) => c.kind === 'revelation').length;
  const prayersSharedCount = prayers.length;
  const prayersAnsweredCount = prayers.filter((p) => p.answered).length;
  const amensGivenCount = reactions.filter((r) => r.target_type === 'checkin').length;
  const prayingTapsCount = reactions.filter((r) => r.target_type === 'prayer').length;
  const animalsBoughtCount = (animalsResult.data ?? []).filter((row) => getGardenItem(row.item_key)?.kind === 'animal').length;

  const beforeNineDays = new Set(
    checkins.filter((c) => new Date(c.created_at).getHours() < 9).map((c) => dayKey(c.created_at))
  ).size;
  const sundaysRead = new Set(
    checkins.filter((c) => new Date(c.created_at).getDay() === 0).map((c) => dayKey(c.created_at))
  ).size;
  const distinctDaysRead = new Set(checkins.map((c) => dayKey(c.created_at))).size;

  const finishedBooks = computeFinishedBooks(checkins);

  const metricValues: Record<CountMetric, number> = {
    totalCheckins,
    reflections: reflectionCount,
    actionCheckins: actionCheckinCount,
    revelationCheckins: revelationCheckinCount,
    prayersShared: prayersSharedCount,
    amensGiven: amensGivenCount,
    prayingTaps: prayingTapsCount,
    prayersAnswered: prayersAnsweredCount,
    largestGroupMemberCount,
    animalsBought: animalsBoughtCount,
    beforeNineDays,
    sundaysRead,
    distinctDaysRead,
    finishedBooksCount: finishedBooks.size,
  };

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const daysReadThisWeek = new Set(
    checkins.filter((c) => new Date(c.created_at) >= weekStart).map((c) => dayKey(c.created_at))
  ).size;

  const monthStart = startOfMonth(now);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const daysReadThisMonth = new Set(
    checkins.filter((c) => new Date(c.created_at) >= monthStart).map((c) => dayKey(c.created_at))
  ).size;

  function countQualifyingPeriods(targetDays: number, keyFor: (date: Date) => string): number {
    const byPeriod = new Map<string, Set<string>>();
    for (const row of checkins) {
      const date = new Date(row.created_at);
      const periodKey = keyFor(date);
      const set = byPeriod.get(periodKey) ?? new Set<string>();
      set.add(dayKey(row.created_at));
      byPeriod.set(periodKey, set);
    }
    let count = 0;
    for (const days of byPeriod.values()) {
      if (days.size >= targetDays) count++;
    }
    return count;
  }

  const comebacks = countComebacks(checkins);

  const results: MissionProgress[] = [];
  let bonusDropsEarned = 0;

  for (const def of ALL_MISSIONS) {
    if (def.kind === 'period') {
      const isWeek = def.period === 'week';
      const current = isWeek ? daysReadThisWeek : daysReadThisMonth;
      const periodEnd = isWeek ? weekEnd : monthEnd;
      const qualifyingPeriods = countQualifyingPeriods(def.targetDays, (d) =>
        isWeek ? startOfWeek(d).toISOString().slice(0, 10) : `${d.getFullYear()}-${d.getMonth()}`
      );
      const achieved = current >= def.targetDays;
      results.push({
        key: def.key,
        section: def.section,
        title: def.title,
        verse: def.verse,
        description: def.description,
        reward: def.reward,
        progress: Math.min(def.targetDays, current),
        target: def.targetDays,
        achieved,
        daysLeft: daysUntil(periodEnd, now),
      });
      bonusDropsEarned += qualifyingPeriods * def.reward;
      continue;
    }

    if (def.kind === 'count') {
      const value = metricValues[def.metric];
      const progress = Math.min(def.target, value);
      const achieved = value >= def.target;
      results.push({
        key: def.key,
        section: def.section,
        title: def.title,
        verse: def.verse,
        description: def.description,
        reward: def.reward,
        progress,
        target: def.target,
        achieved,
      });
      if (achieved) bonusDropsEarned += def.reward;
      continue;
    }

    if (def.kind === 'books') {
      const booksDone = def.books.filter((b) => finishedBooks.has(b));
      const achieved = booksDone.length === def.books.length;
      results.push({
        key: def.key,
        section: def.section,
        title: def.title,
        verse: def.verse,
        description: def.description,
        reward: def.reward,
        progress: booksDone.length,
        target: def.books.length,
        achieved,
        bookNames: def.books,
        booksDone,
      });
      if (achieved) bonusDropsEarned += def.reward;
      continue;
    }

    // Repeatable.
    results.push({
      key: def.key,
      section: def.section,
      title: def.title,
      verse: def.verse,
      description: def.description,
      reward: def.reward,
      progress: comebacks > 0 ? 1 : 0,
      target: 1,
      achieved: comebacks > 0,
      repeatable: true,
      timesEarned: comebacks,
    });
    bonusDropsEarned += comebacks * def.reward;
  }

  const bySection = new Map<MissionSection, MissionProgress[]>();
  for (const mission of results) {
    const list = bySection.get(mission.section) ?? [];
    list.push(mission);
    bySection.set(mission.section, list);
  }

  const sections = SECTION_ORDER.filter((section) => bySection.has(section)).map((section) => ({
    section,
    missions: bySection.get(section)!,
  }));

  return { sections, bonusDropsEarned };
}
