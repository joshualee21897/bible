import { getChapterCount } from './bible-books';
import { getCurrentChapterNumber } from './checkins';
import { DAILY_DROPS, type DailyDropKey } from './mission-config';
import { supabase } from './supabase';

export type { DailyDropKey };

export type DailyDropStatus = 'growing' | 'collect' | 'collected';

export type DailyDropRow = {
  key: DailyDropKey;
  title: string;
  verse: string;
  description: string;
  reward: number;
  status: DailyDropStatus;
};

export type DailyDropsSummary = {
  rows: DailyDropRow[];
  collectedCount: number;
  allCollected: boolean;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

// Local, not UTC, so the daily reset lines up with the person's own midnight.
function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function getDailyDrops(): Promise<DailyDropsSummary> {
  const userId = await requireUserId();
  const now = new Date();
  const todayKey = localDateKey(now);
  const todayStart = startOfLocalDay(now);

  const [groupsResult, checkinsResult, reactionsResult, claimsResult] = await Promise.all([
    supabase.from('group_members').select('groups(id, book, start_date)').eq('user_id', userId),
    supabase
      .from('checkins')
      .select('group_id, chapter, reflection, photo_path')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('reactions')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', 'prayer')
      .gte('created_at', todayStart.toISOString()),
    supabase.from('daily_claims').select('claim_key').eq('user_id', userId).eq('claim_date', todayKey),
  ]);

  if (groupsResult.error) throw groupsResult.error;
  if (checkinsResult.error) throw checkinsResult.error;
  if (reactionsResult.error) throw reactionsResult.error;
  if (claimsResult.error) throw claimsResult.error;

  const groupRows = (groupsResult.data ?? []) as unknown as {
    groups: { id: string; book: string; start_date: string } | null;
  }[];
  const groups = groupRows.map((row) => row.groups).filter((g): g is { id: string; book: string; start_date: string } => Boolean(g));

  const todayChapterByGroup = new Map(
    groups.map((g) => [g.id, getCurrentChapterNumber(g.start_date, getChapterCount(g.book))])
  );

  const checkinsToday = checkinsResult.data ?? [];
  const claimedKeys = new Set((claimsResult.data ?? []).map((row) => row.claim_key));

  const eligibility: Record<DailyDropKey, boolean> = {
    morning_manna: true,
    daily_bread: checkinsToday.some((c) => c.chapter === todayChapterByGroup.get(c.group_id)),
    fruit_of_the_lips: checkinsToday.some((c) => Boolean(c.reflection)),
    snapshot_of_grace: checkinsToday.some((c) => Boolean(c.photo_path)),
    second_mile: checkinsToday.length >= 2,
    stand_in_the_gap: (reactionsResult.data ?? []).length > 0,
  };

  const rows: DailyDropRow[] = DAILY_DROPS.map((def) => {
    const status: DailyDropStatus = claimedKeys.has(def.key) ? 'collected' : eligibility[def.key] ? 'collect' : 'growing';
    return { key: def.key, title: def.title, verse: def.verse, description: def.description, reward: def.reward, status };
  });

  const collectedCount = rows.filter((r) => r.status === 'collected').length;

  return { rows, collectedCount, allCollected: collectedCount === rows.length };
}

// Returns the drops earned, or 0 if it was already claimed (e.g. a race with
// another device) — never throws for that case, since the UI already
// prevents it in the normal flow.
export async function claimDailyDrop(claimKey: DailyDropKey): Promise<number> {
  const userId = await requireUserId();
  const def = DAILY_DROPS.find((d) => d.key === claimKey);
  if (!def) throw new Error('Unknown daily drop');

  const { error } = await supabase
    .from('daily_claims')
    .insert({ user_id: userId, claim_key: claimKey, claim_date: localDateKey(new Date()) });

  if (error) {
    if (error.code === '23505') return 0;
    throw error;
  }
  return def.reward;
}
