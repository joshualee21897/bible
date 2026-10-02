import type { FeedProfile } from './checkins';
import { supabase } from './supabase';

export type Prayer = {
  id: string;
  group_id: string;
  user_id: string;
  text: string;
  show_name: boolean;
  answered: boolean;
  created_at: string;
};

export type PrayerWithProfile = Prayer & { profiles: FeedProfile | null };

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function getGroupPrayers(groupId: string): Promise<PrayerWithProfile[]> {
  const { data, error } = await supabase
    .from('prayers')
    .select('*, profiles(display_name, avatar_color)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PrayerWithProfile[];
}

export async function createPrayer(input: { groupId: string; text: string; showName: boolean }): Promise<Prayer> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('prayers')
    .insert({
      group_id: input.groupId,
      user_id: userId,
      text: input.text,
      show_name: input.showName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markPrayerAnswered(prayerId: string): Promise<Prayer> {
  const { data, error } = await supabase
    .from('prayers')
    .update({ answered: true })
    .eq('id', prayerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
