import { supabase } from './supabase';

export type CheckinKind = 'reflection' | 'revelation' | 'action';

export type Checkin = {
  id: string;
  group_id: string;
  user_id: string;
  book: string;
  chapter: number;
  reflection: string | null;
  photo_path: string | null;
  kind: CheckinKind;
  created_at: string;
};

export type FeedProfile = { display_name: string; avatar_color: string };

export type CheckinWithProfile = Checkin & { profiles: FeedProfile | null };

export type MemberWithStats = {
  user_id: string;
  display_name: string;
  avatar_color: string;
  checkin_count: number;
  last_checkin_at: string | null;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function getGroupFeed(groupId: string): Promise<CheckinWithProfile[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('*, profiles(display_name, avatar_color)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CheckinWithProfile[];
}

export async function getMyCheckedChapters(groupId: string, book: string): Promise<Set<number>> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('checkins')
    .select('chapter')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('book', book);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.chapter));
}

export async function createCheckin(input: {
  groupId: string;
  book: string;
  chapter: number;
  reflection: string;
  kind: CheckinKind;
}): Promise<Checkin> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('checkins')
    .insert({
      group_id: input.groupId,
      user_id: userId,
      book: input.book,
      chapter: input.chapter,
      reflection: input.reflection,
      kind: input.kind,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMyCheckin(groupId: string, book: string, chapter: number): Promise<Checkin | null> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('group_id', groupId)
    .eq('book', book)
    .eq('chapter', chapter)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateCheckin(
  checkinId: string,
  updates: { reflection?: string; kind?: CheckinKind }
): Promise<Checkin> {
  const patch: { reflection?: string; kind?: CheckinKind } = {};
  if (updates.reflection !== undefined) patch.reflection = updates.reflection;
  if (updates.kind !== undefined) patch.kind = updates.kind;

  const { data, error } = await supabase.from('checkins').update(patch).eq('id', checkinId).select().single();

  if (error) throw error;
  return data;
}

export async function getGroupMembersWithCheckinCounts(groupId: string): Promise<MemberWithStats[]> {
  const [membersResult, checkinsResult] = await Promise.all([
    supabase.from('group_members').select('user_id, profiles(display_name, avatar_color)').eq('group_id', groupId),
    supabase.from('checkins').select('user_id, created_at').eq('group_id', groupId),
  ]);

  if (membersResult.error) throw membersResult.error;
  if (checkinsResult.error) throw checkinsResult.error;

  const counts = new Map<string, number>();
  const lastCheckinAt = new Map<string, string>();
  for (const row of checkinsResult.data ?? []) {
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
    const existing = lastCheckinAt.get(row.user_id);
    if (!existing || row.created_at > existing) {
      lastCheckinAt.set(row.user_id, row.created_at);
    }
  }

  return (membersResult.data ?? [])
    .filter((row): row is typeof row & { profiles: FeedProfile } => Boolean(row.profiles))
    .map((row) => ({
      user_id: row.user_id,
      display_name: row.profiles.display_name,
      avatar_color: row.profiles.avatar_color,
      checkin_count: counts.get(row.user_id) ?? 0,
      last_checkin_at: lastCheckinAt.get(row.user_id) ?? null,
    }));
}

// A check-in can still be changed on the day it was made — once a new day
// has started (in the person's own local time), it's locked in.
export function isEditableToday(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
}

export function getDayNumber(startDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayIndex = Math.floor((nowMidnight.getTime() - startMidnight.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, dayIndex + 1);
}

export function getCurrentChapterNumber(startDate: string, maxChapter: number): number {
  return Math.min(getDayNumber(startDate), maxChapter);
}

export function isBookFinished(startDate: string, maxChapter: number): boolean {
  return getDayNumber(startDate) > maxChapter;
}
