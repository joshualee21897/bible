import { getGardenItem } from './garden-items';
import { supabase } from './supabase';

export type DropsSummary = {
  earned: number;
  spent: number;
  balance: number;
};

async function getGroupItemKeys(groupId: string): Promise<string[]> {
  const { data, error } = await supabase.from('group_items').select('item_key').eq('group_id', groupId);
  if (error) throw error;
  return (data ?? []).map((row) => row.item_key);
}

export async function getOwnedItemKeys(groupId: string): Promise<Set<string>> {
  return new Set(await getGroupItemKeys(groupId));
}

// Drops are always computed from check-ins and purchases, never stored, so
// the balance can't drift out of sync with the data.
export async function getDropsSummary(groupId: string): Promise<DropsSummary> {
  const [checkinsResult, itemKeys] = await Promise.all([
    supabase.from('checkins').select('reflection, photo_path').eq('group_id', groupId),
    getGroupItemKeys(groupId),
  ]);

  if (checkinsResult.error) throw checkinsResult.error;

  const earned = (checkinsResult.data ?? []).reduce((total, checkin) => {
    let amount = 10;
    if (checkin.reflection) amount += 3;
    if (checkin.photo_path) amount += 3;
    return total + amount;
  }, 0);

  const spent = itemKeys.reduce((total, key) => total + (getGardenItem(key)?.price ?? 0), 0);

  return { earned, spent, balance: earned - spent };
}

export async function buyGardenItem(groupId: string, userId: string, itemKey: string): Promise<void> {
  const { error } = await supabase
    .from('group_items')
    .insert({ group_id: groupId, item_key: itemKey, bought_by: userId });
  if (error) throw error;
}
