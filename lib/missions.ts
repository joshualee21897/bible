import { getChapterCount } from './bible-books';
import { getGardenItem } from './garden-items';
import { getLevelForTotal } from './garden-levels';
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
  periodKey: string;
  section: MissionSection;
  title: string;
  verse: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  // True once the mission's target is reached but the reward hasn't been
  // collected yet — the Missions tab shows a Collect button for these.
  readyToCollect: boolean;
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

type CheckinRow = { group_id: string; book: string; chapter: number; reflection: string | null; created_at: string };

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

// How many times this person has given to any Storehouse, and the highest
// garden level any group they belong to has reached (from that group's
// total deposits, across everyone in it) — used by the Cheerful Giver and
// Laborers Together missions.
async function getStorehouseMetrics(userId: string): Promise<{ depositsMade: number; maxGroupLevelReached: number }> {
  const [ownDepositsResult, myGroupsResult] = await Promise.all([
    supabase.from('storehouse_deposits').select('id').eq('user_id', userId),
    supabase.from('group_members').select('group_id').eq('user_id', userId),
  ]);
  if (ownDepositsResult.error) throw ownDepositsResult.error;
  if (myGroupsResult.error) throw myGroupsResult.error;

  const groupIds = (myGroupsResult.data ?? []).map((row) => row.group_id);
  if (groupIds.length === 0) {
    return { depositsMade: (ownDepositsResult.data ?? []).length, maxGroupLevelReached: 0 };
  }

  const { data: groupDeposits, error: groupDepositsError } = await supabase
    .from('storehouse_deposits')
    .select('group_id, amount')
    .in('group_id', groupIds);
  if (groupDepositsError) throw groupDepositsError;

  const totalsByGroup = new Map<string, number>();
  for (const row of groupDeposits ?? []) {
    totalsByGroup.set(row.group_id, (totalsByGroup.get(row.group_id) ?? 0) + row.amount);
  }

  let maxGroupLevelReached = 0;
  for (const total of totalsByGroup.values()) {
    maxGroupLevelReached = Math.max(maxGroupLevelReached, getLevelForTotal(total).level.index);
  }

  return { depositsMade: (ownDepositsResult.data ?? []).length, maxGroupLevelReached };
}

function weekPeriodKey(date: Date): string {
  return `week:${startOfWeek(date).toISOString().slice(0, 10)}`;
}

function monthPeriodKey(date: Date): string {
  return `month:${date.getFullYear()}-${date.getMonth()}`;
}

export async function getMissionSummary(): Promise<MissionSummary> {
  const userId = await requireUserId();

  const [
    checkinsResult,
    prayersResult,
    reactionsResult,
    animalsResult,
    claimsResult,
    largestGroupMemberCount,
    storehouseMetrics,
  ] = await Promise.all([
    supabase.from('checkins').select('group_id, book, chapter, reflection, created_at').eq('user_id', userId),
    supabase.from('prayers').select('answered').eq('user_id', userId),
    supabase.from('reactions').select('target_type').eq('user_id', userId),
    supabase.from('group_items').select('item_key').eq('bought_by', userId),
    supabase.from('mission_claims').select('mission_key, period_key').eq('user_id', userId),
    getLargestGroupMemberCount(userId),
    getStorehouseMetrics(userId),
  ]);

  if (checkinsResult.error) throw checkinsResult.error;
  if (prayersResult.error) throw prayersResult.error;
  if (reactionsResult.error) throw reactionsResult.error;
  if (animalsResult.error) throw animalsResult.error;
  if (claimsResult.error) throw claimsResult.error;

  const checkins = (checkinsResult.data ?? []) as CheckinRow[];
  const prayers = prayersResult.data ?? [];
  const reactions = reactionsResult.data ?? [];
  const claims = claimsResult.data ?? [];
  const claimedKeys = new Set(claims.map((c) => `${c.mission_key}:${c.period_key}`));
  const claimedCountByMission = new Map<string, number>();
  for (const c of claims) {
    claimedCountByMission.set(c.mission_key, (claimedCountByMission.get(c.mission_key) ?? 0) + 1);
  }

  const totalCheckins = checkins.length;
  const reflectionCount = checkins.filter((c) => c.reflection).length;
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
    storehouseDepositsMade: storehouseMetrics.depositsMade,
    maxGroupLevelReached: storehouseMetrics.maxGroupLevelReached,
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

  const comebacks = countComebacks(checkins);

  const results: MissionProgress[] = [];
  let bonusDropsEarned = 0;

  // Every claimed reward counts toward the balance, regardless of whether
  // the mission is still visible (a collected count/books mission hides,
  // but the drops it paid out stay earned).
  for (const claim of claims) {
    const def = ALL_MISSIONS.find((d) => d.key === claim.mission_key);
    if (def) bonusDropsEarned += def.reward;
  }

  for (const def of ALL_MISSIONS) {
    if (def.kind === 'period') {
      const isWeek = def.period === 'week';
      const current = isWeek ? daysReadThisWeek : daysReadThisMonth;
      const periodEnd = isWeek ? weekEnd : monthEnd;
      const periodKey = isWeek ? weekPeriodKey(now) : monthPeriodKey(now);
      const metTarget = current >= def.targetDays;
      const claimed = claimedKeys.has(`${def.key}:${periodKey}`);
      // Once collected for this period, it disappears until a new period
      // (a different periodKey) also reaches the target.
      if (metTarget && claimed) continue;
      results.push({
        key: def.key,
        periodKey,
        section: def.section,
        title: def.title,
        verse: def.verse,
        description: def.description,
        reward: def.reward,
        progress: Math.min(def.targetDays, current),
        target: def.targetDays,
        readyToCollect: metTarget && !claimed,
        daysLeft: daysUntil(periodEnd, now),
      });
      continue;
    }

    if (def.kind === 'count') {
      const value = metricValues[def.metric];
      const progress = Math.min(def.target, value);
      const metTarget = value >= def.target;
      const claimed = claimedKeys.has(`${def.key}:`);
      if (metTarget && claimed) continue;
      results.push({
        key: def.key,
        periodKey: '',
        section: def.section,
        title: def.title,
        verse: def.verse,
        description: def.description,
        reward: def.reward,
        progress,
        target: def.target,
        readyToCollect: metTarget && !claimed,
      });
      continue;
    }

    if (def.kind === 'books') {
      const booksDone = def.books.filter((b) => finishedBooks.has(b));
      const metTarget = booksDone.length === def.books.length;
      const claimed = claimedKeys.has(`${def.key}:`);
      if (metTarget && claimed) continue;
      results.push({
        key: def.key,
        periodKey: '',
        section: def.section,
        title: def.title,
        verse: def.verse,
        description: def.description,
        reward: def.reward,
        progress: booksDone.length,
        target: def.books.length,
        readyToCollect: metTarget && !claimed,
        bookNames: def.books,
        booksDone,
      });
      continue;
    }

    // Repeatable — each comeback is its own occurrence to collect.
    const claimedCount = claimedCountByMission.get(def.key) ?? 0;
    const pending = comebacks - claimedCount;
    if (pending <= 0) continue;
    results.push({
      key: def.key,
      periodKey: String(claimedCount + 1),
      section: def.section,
      title: def.title,
      verse: def.verse,
      description: def.description,
      reward: def.reward,
      progress: 1,
      target: 1,
      readyToCollect: true,
      repeatable: true,
      timesEarned: claimedCount,
    });
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

// Returns the drops earned, or 0 if this exact mission+period was already
// claimed (e.g. a race with another device) — never throws for that case.
export async function claimMission(missionKey: string, periodKey: string): Promise<number> {
  const userId = await requireUserId();
  const def = ALL_MISSIONS.find((d) => d.key === missionKey);
  if (!def) throw new Error('Unknown mission');

  const { error } = await supabase
    .from('mission_claims')
    .insert({ user_id: userId, mission_key: missionKey, period_key: periodKey });

  if (error) {
    if (error.code === '23505') return 0;
    throw error;
  }
  return def.reward;
}
