import { supabase } from './supabase';

export type Profile = {
  id: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function getMyProfile(): Promise<Profile | null> {
  const userId = await requireUserId();

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) throw error;
  return data;
}

export async function createMyProfile(displayName: string, avatarColor: string): Promise<Profile> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, display_name: displayName, avatar_color: avatarColor })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMyProfile(displayName: string, avatarColor: string): Promise<Profile> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, avatar_color: avatarColor })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
