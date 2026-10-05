import { DAILY_DROPS } from './mission-config';
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

// Drops are personal: everything you've earned — from collecting daily
// drops and from Missions bonuses — across every group you're in, minus
// everything you've spent in any group's shop. Always computed fresh from
// the data, never stored, so it can't drift out of sync.
//
// Reading itself no longer earns drops automatically on check-in — that
// used to double-count against the Today tab's "Daily drops" checklist
// (Daily Bread / Fruit of the Lips / Snapshot of Grace cover the same
// ground as a chapter + reflection + photo). Drops now only come from
// explicitly collecting a daily drop or a Missions bonus.
export async function getDropsSummary(): Promise<DropsSummary> {
  const userId = await requireUserId();

  const [claimsResult, spentResult, missionSummary] = await Promise.all([
    supabase.from('daily_claims').select('claim_key').eq('user_id', userId),
    supabase.from('group_items').select('item_key').eq('bought_by', userId),
    getMissionSummary(),
  ]);

  if (claimsResult.error) throw claimsResult.error;
  if (spentResult.error) throw spentResult.error;

  const rewardByKey = new Map(DAILY_DROPS.map((d) => [d.key, d.reward]));
  const earnedFromDailyDrops = (claimsResult.data ?? []).reduce(
    (total, row) => total + (rewardByKey.get(row.claim_key) ?? 0),
    0
  );

  const earned = earnedFromDailyDrops + missionSummary.bonusDropsEarned;

  const spent = (spentResult.data ?? []).reduce((total, row) => total + (getGardenItem(row.item_key)?.price ?? 0), 0);

  return { earned, spent, balance: earned - spent };
}

export async function buyGardenItem(groupId: string, userId: string, itemKey: string): Promise<void> {
  const { error } = await supabase
    .from('group_items')
    .insert({ group_id: groupId, item_key: itemKey, bought_by: userId });
  if (error) throw error;
}
