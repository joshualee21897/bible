import { supabase } from './supabase';

export type ReactionTargetType = 'checkin' | 'prayer';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function getReactionsFor(
  targetType: ReactionTargetType,
  targetIds: string[]
): Promise<{ counts: Record<string, number>; mine: Set<string> }> {
  if (targetIds.length === 0) return { counts: {}, mine: new Set() };

  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('reactions')
    .select('target_id, user_id')
    .eq('target_type', targetType)
    .in('target_id', targetIds);

  if (error) throw error;

  const counts: Record<string, number> = {};
  const mine = new Set<string>();
  for (const row of data ?? []) {
    counts[row.target_id] = (counts[row.target_id] ?? 0) + 1;
    if (row.user_id === userId) mine.add(row.target_id);
  }
  return { counts, mine };
}

export async function addReaction(targetType: ReactionTargetType, targetId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('reactions')
    .insert({ target_type: targetType, target_id: targetId, user_id: userId });
  if (error) throw error;
}

export async function removeReaction(targetType: ReactionTargetType, targetId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', userId);
  if (error) throw error;
}
