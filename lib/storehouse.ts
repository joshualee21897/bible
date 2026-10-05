import { GARDEN_LEVELS, getLevelForTotal, type GardenLevelProgress } from './garden-levels';
import { supabase } from './supabase';

export type StorehouseSummary = {
  total: number;
  progress: GardenLevelProgress;
  // Distinct givers' names only, in the order they first gave — amounts and
  // rankings are never shown (Matthew 6:3).
  givers: string[];
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function getStorehouseSummary(groupId: string): Promise<StorehouseSummary> {
  const { data, error } = await supabase
    .from('storehouse_deposits')
    .select('amount, created_at, profiles(display_name)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as unknown as { amount: number; profiles: { display_name: string } | null }[];

  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const progress = getLevelForTotal(total);

  const seen = new Set<string>();
  const givers: string[] = [];
  for (const row of rows) {
    const name = row.profiles?.display_name;
    if (name && !seen.has(name)) {
      seen.add(name);
      givers.push(name);
    }
  }

  return { total, progress, givers };
}

// The database itself rejects a deposit larger than the person's balance
// (see the storehouse_deposits trigger in the migrations) — this surfaces
// that as a friendly error if it somehow gets past the app's own check.
export async function depositToStorehouse(groupId: string, amount: number): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('storehouse_deposits').insert({ group_id: groupId, user_id: userId, amount });
  if (error) {
    if (error.message.includes('Insufficient drops balance')) {
      throw new Error("You don't have enough drops for that.");
    }
    throw error;
  }
}

// Every level a group has already reached that the database doesn't yet
// have a group_level_events row for gets one recorded here — whichever
// device notices first "wins" the insert (the table's unique constraint
// silently no-ops any later, duplicate attempt), so the celebration and the
// feed banner only ever happen once per group per level.
export async function recordLevelsReached(groupId: string, currentLevelIndex: number): Promise<void> {
  if (currentLevelIndex <= 0) return;
  const rows = [];
  for (let i = 1; i <= currentLevelIndex; i++) {
    rows.push({ group_id: groupId, level_index: i });
  }
  const { error } = await supabase.from('group_level_events').upsert(rows, { onConflict: 'group_id,level_index', ignoreDuplicates: true });
  if (error) throw error;
}

export type LevelEvent = {
  id: string;
  group_id: string;
  level_index: number;
  reached_at: string;
};

export async function getLevelEvents(groupId: string): Promise<LevelEvent[]> {
  const { data, error } = await supabase
    .from('group_level_events')
    .select('id, group_id, level_index, reached_at')
    .eq('group_id', groupId);
  if (error) throw error;
  return data ?? [];
}

export { GARDEN_LEVELS };
