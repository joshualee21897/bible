import { getChapterCount } from './bible-books';
import { getCurrentChapterNumber, isBookFinished } from './checkins';
import { listMyGroups, type MyGroup } from './groups';
import { startOfWeek } from './weekly-goal';
import { supabase } from './supabase';

export type MyGroupToday = {
  group: MyGroup;
  todayChapter: number;
  maxChapter: number;
  finished: boolean;
  checkedInToday: boolean;
};

export type MyDashboard = {
  totalCheckins: number;
  weekDaysRead: number;
  groups: MyGroupToday[];
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function getMyDashboard(): Promise<MyDashboard> {
  const userId = await requireUserId();
  const groups = await listMyGroups();

  const { data, error } = await supabase
    .from('checkins')
    .select('group_id, chapter, created_at')
    .eq('user_id', userId);

  if (error) throw error;
  const myCheckins = data ?? [];

  const totalCheckins = myCheckins.length;

  const weekStart = startOfWeek(new Date());
  const weekDayKeys = new Set<string>();
  for (const row of myCheckins) {
    if (new Date(row.created_at) >= weekStart) {
      weekDayKeys.add(row.created_at.slice(0, 10));
    }
  }

  const checkinsByGroup = new Map<string, Set<number>>();
  for (const row of myCheckins) {
    const chapters = checkinsByGroup.get(row.group_id) ?? new Set<number>();
    chapters.add(row.chapter);
    checkinsByGroup.set(row.group_id, chapters);
  }

  const groupRows: MyGroupToday[] = groups.map((group) => {
    const maxChapter = getChapterCount(group.book);
    const todayChapter = getCurrentChapterNumber(group.start_date, maxChapter);
    const finished = isBookFinished(group.start_date, maxChapter);
    const checkedInToday = checkinsByGroup.get(group.id)?.has(todayChapter) ?? false;
    return { group, todayChapter, maxChapter, finished, checkedInToday };
  });

  return {
    totalCheckins,
    weekDaysRead: weekDayKeys.size,
    groups: groupRows,
  };
}
