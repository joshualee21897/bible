import { supabase } from './supabase';

export type WeeklyGoalSummary = {
  daysRead: number;
  combinedTarget: number;
  percent: number;
  meetsHarvestThreshold: boolean;
  memberCount: number;
};

const HARVEST_THRESHOLD_PERCENT = 80;

function startOfWeek(date: Date): Date {
  const day = date.getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = (day + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - diffToMonday);
}

export async function getWeeklyGoalSummary(groupId: string, weeklyTarget: number): Promise<WeeklyGoalSummary> {
  const weekStart = startOfWeek(new Date());

  const [checkinsResult, membersResult] = await Promise.all([
    supabase
      .from('checkins')
      .select('user_id, created_at')
      .eq('group_id', groupId)
      .gte('created_at', weekStart.toISOString()),
    supabase.from('group_members').select('user_id').eq('group_id', groupId),
  ]);

  if (checkinsResult.error) throw checkinsResult.error;
  if (membersResult.error) throw membersResult.error;

  // Count distinct reading days per person this week, not raw check-in rows,
  // so catching up several chapters in one sitting only counts as one day.
  const readDaysByUser = new Map<string, Set<string>>();
  for (const row of checkinsResult.data ?? []) {
    const dateKey = row.created_at.slice(0, 10);
    const days = readDaysByUser.get(row.user_id) ?? new Set<string>();
    days.add(dateKey);
    readDaysByUser.set(row.user_id, days);
  }

  const daysRead = [...readDaysByUser.values()].reduce((total, days) => total + days.size, 0);
  const memberCount = membersResult.data?.length ?? 0;
  const combinedTarget = weeklyTarget * memberCount;
  const percent = combinedTarget > 0 ? Math.min(100, Math.round((daysRead / combinedTarget) * 100)) : 0;

  return {
    daysRead,
    combinedTarget,
    percent,
    meetsHarvestThreshold: percent >= HARVEST_THRESHOLD_PERCENT,
    memberCount,
  };
}
