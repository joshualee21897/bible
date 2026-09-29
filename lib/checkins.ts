import { supabase } from './supabase';

export type Checkin = {
  id: string;
  group_id: string;
  user_id: string;
  book: string;
  chapter: number;
  reflection: string | null;
  photo_path: string | null;
  created_at: string;
};

export type FeedProfile = { display_name: string; avatar_color: string };

export type CheckinWithProfile = Checkin & { profiles: FeedProfile | null };

export type MemberWithStats = {
  user_id: string;
  display_name: string;
  avatar_color: string;
  checkin_count: number;
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
  reflection?: string | null;
  photoPath?: string | null;
}): Promise<Checkin> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('checkins')
    .insert({
      group_id: input.groupId,
      user_id: userId,
      book: input.book,
      chapter: input.chapter,
      reflection: input.reflection ?? null,
      photo_path: input.photoPath ?? null,
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
  updates: { reflection?: string | null; photoPath?: string | null }
): Promise<Checkin> {
  const patch: { reflection?: string | null; photo_path?: string | null } = {};
  if (updates.reflection !== undefined) patch.reflection = updates.reflection;
  if (updates.photoPath !== undefined) patch.photo_path = updates.photoPath;

  const { data, error } = await supabase.from('checkins').update(patch).eq('id', checkinId).select().single();

  if (error) throw error;
  return data;
}

export async function getGroupMembersWithCheckinCounts(groupId: string): Promise<MemberWithStats[]> {
  const [membersResult, checkinsResult] = await Promise.all([
    supabase.from('group_members').select('user_id, profiles(display_name, avatar_color)').eq('group_id', groupId),
    supabase.from('checkins').select('user_id').eq('group_id', groupId),
  ]);

  if (membersResult.error) throw membersResult.error;
  if (checkinsResult.error) throw checkinsResult.error;

  const counts = new Map<string, number>();
  for (const row of checkinsResult.data ?? []) {
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }

  return (membersResult.data ?? [])
    .filter((row): row is typeof row & { profiles: FeedProfile } => Boolean(row.profiles))
    .map((row) => ({
      user_id: row.user_id,
      display_name: row.profiles.display_name,
      avatar_color: row.profiles.avatar_color,
      checkin_count: counts.get(row.user_id) ?? 0,
    }));
}

export async function uploadCheckinPhoto(
  groupId: string,
  userId: string,
  fileUri: string,
  mimeType: string
): Promise<string> {
  const extension = mimeType.split('/')[1] ?? 'jpg';
  const path = `${groupId}/${userId}/${Date.now()}.${extension}`;

  const response = await fetch(fileUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from('checkin-photos').upload(path, arrayBuffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function getSignedPhotoUrl(photoPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('checkin-photos').createSignedUrl(photoPath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export function getCurrentChapterNumber(startDate: string, maxChapter: number): number {
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayIndex = Math.floor((nowMidnight.getTime() - startMidnight.getTime()) / (1000 * 60 * 60 * 24));
  const dayNumber = Math.max(1, dayIndex + 1);
  return Math.min(dayNumber, maxChapter);
}
