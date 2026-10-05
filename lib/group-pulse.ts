import { supabase } from './supabase';

export type GroupPulse = {
  latestCheckinName: string | null;
  newPrayersCount: number;
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Today's activity per group — who most recently checked in, and how many
// prayers were posted today. Used by the Today tab's "Group pulse" rows.
export async function getGroupPulses(groupIds: string[]): Promise<Record<string, GroupPulse>> {
  if (groupIds.length === 0) return {};

  const todayStart = startOfLocalDay(new Date());

  const [checkinsResult, prayersResult] = await Promise.all([
    supabase
      .from('checkins')
      .select('group_id, created_at, profiles(display_name)')
      .in('group_id', groupIds)
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('prayers')
      .select('group_id')
      .in('group_id', groupIds)
      .gte('created_at', todayStart.toISOString()),
  ]);

  if (checkinsResult.error) throw checkinsResult.error;
  if (prayersResult.error) throw prayersResult.error;

  const checkinRows = (checkinsResult.data ?? []) as unknown as {
    group_id: string;
    created_at: string;
    profiles: { display_name: string } | null;
  }[];

  const pulses: Record<string, GroupPulse> = {};
  for (const groupId of groupIds) {
    pulses[groupId] = { latestCheckinName: null, newPrayersCount: 0 };
  }

  // Rows are already newest-first, so the first one seen per group is the latest.
  for (const row of checkinRows) {
    if (pulses[row.group_id].latestCheckinName === null) {
      pulses[row.group_id].latestCheckinName = row.profiles?.display_name ?? 'Someone';
    }
  }

  for (const row of prayersResult.data ?? []) {
    pulses[row.group_id].newPrayersCount += 1;
  }

  return pulses;
}
