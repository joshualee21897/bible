import { generateInviteCode } from './invite-code';
import { supabase } from './supabase';

export type Group = {
  id: string;
  name: string;
  invite_code: string;
  book: string;
  start_date: string;
  weekly_target: number;
  created_by: string;
  created_at: string;
};

export type MyGroup = Group & { role: 'owner' | 'member' };

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function listMyGroups(): Promise<MyGroup[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('group_members')
    .select('role, groups(*)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as { role: 'owner' | 'member'; groups: Group | null }[];

  return rows
    .filter((row): row is { role: 'owner' | 'member'; groups: Group } => Boolean(row.groups))
    .map((row) => ({ ...row.groups, role: row.role }));
}

export async function createGroup(input: {
  name: string;
  book: string;
  startDate: string;
  weeklyTarget: number;
}): Promise<Group> {
  const userId = await requireUserId();
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const inviteCode = generateInviteCode();
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: input.name,
        book: input.book,
        start_date: input.startDate,
        weekly_target: input.weeklyTarget,
        invite_code: inviteCode,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      const isDuplicateCode = error.code === '23505';
      if (isDuplicateCode && attempt < maxAttempts - 1) continue;
      throw error;
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: data.id, user_id: userId, role: 'owner' });
    if (memberError) throw memberError;

    return data;
  }

  throw new Error('Could not create a unique invite code. Please try again.');
}

export async function joinGroupByCode(code: string): Promise<Group> {
  const { data, error } = await supabase.rpc('join_group_by_code', {
    p_invite_code: code.trim(),
  });
  if (error) throw error;
  return data as Group;
}
