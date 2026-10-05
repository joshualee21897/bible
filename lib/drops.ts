import { getGardenItem } from './garden-items';
import { getMissionSummary } from './missions';
import { supabase } from './supabase';

export type DropsSummary = {
  earned: number;
  spent: number;
  balance: number;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function getOwnedItemKeys(groupId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('group_items').select('item_key').eq('group_id', groupId);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.item_key));
}

// Drops are personal: everything you've earned from your own check-ins
// across every group you're in, plus mission bonuses, minus everything
// you've spent in any group's shop. Always computed fresh from the data,
// never stored, so it can't drift out of sync.
export async function getDropsSummary(): Promise<DropsSummary> {
  const userId = await requireUserId();

  const [checkinsResult, spentResult, missionSummary] = await Promise.all([
    supabase.from('checkins').select('reflection, photo_path').eq('user_id', userId),
    supabase.from('group_items').select('item_key').eq('bought_by', userId),
    getMissionSummary(),
  ]);

  if (checkinsResult.error) throw checkinsResult.error;
  if (spentResult.error) throw spentResult.error;

  const earnedFromReading = (checkinsResult.data ?? []).reduce((total, checkin) => {
    let amount = 10;
    if (checkin.reflection) amount += 3;
    if (checkin.photo_path) amount += 3;
    return total + amount;
  }, 0);

  const earned = earnedFromReading + missionSummary.bonusDropsEarned;

  const spent = (spentResult.data ?? []).reduce((total, row) => total + (getGardenItem(row.item_key)?.price ?? 0), 0);

  return { earned, spent, balance: earned - spent };
}

export async function buyGardenItem(groupId: string, userId: string, itemKey: string): Promise<void> {
  const { error } = await supabase
    .from('group_items')
    .insert({ group_id: groupId, item_key: itemKey, bought_by: userId });
  if (error) throw error;
}
