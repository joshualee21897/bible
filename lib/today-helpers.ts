import type { LambMood } from '../components/pixel/lamb-sprites';
import type { MyDashboard } from './dashboard';
import type { GroupPulse } from './group-pulse';
import type { TreeStage } from './tree';

const RESTING_AFTER_DAYS = 3;

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function buildLambGuide(
  dashboard: MyDashboard,
  stage: TreeStage,
  grewStage: boolean
): { message: string; pose: LambMood; sparkles: boolean } {
  if (grewStage) {
    return { message: 'Your tree just grew! Keep going.', pose: 'happy', sparkles: true };
  }

  const groupThatBoreFruit = dashboard.groups.find((row) => row.meetsHarvestThreshold);
  if (groupThatBoreFruit) {
    return {
      message: 'Our garden bore fruit this week! Time for a Harvest Supper?',
      pose: 'happy',
      sparkles: true,
    };
  }

  const daysSinceLastCheckin = dashboard.lastCheckinAt
    ? (Date.now() - new Date(dashboard.lastCheckinAt).getTime()) / (1000 * 60 * 60 * 24)
    : null;
  if (daysSinceLastCheckin !== null && daysSinceLastCheckin >= RESTING_AFTER_DAYS) {
    return { message: 'Welcome back! His mercies are new every morning.', pose: 'waving', sparkles: false };
  }

  if (new Date().getDay() === 0) {
    return { message: 'Be strong and of a good courage. — Joshua 1:9', pose: 'happy', sparkles: false };
  }

  if (dashboard.groups.length === 0) {
    return { message: 'Join or create a group to start a garden.', pose: 'waving', sparkles: false };
  }

  const waitingGroups = dashboard.groups.filter((row) => !row.checkedInToday);
  if (waitingGroups.length === 0) {
    return { message: `${greeting()}! Our gardens are happy today.`, pose: 'happy', sparkles: false };
  }
  if (waitingGroups.length === 1) {
    const row = waitingGroups[0];
    return {
      message: row.finished
        ? `${greeting()}! Your groups have a chapter waiting.`
        : `${row.group.book} ${row.todayChapter} is waiting for you.`,
      pose: 'waving',
      sparkles: false,
    };
  }

  return { message: `You have ${pluralize(waitingGroups.length, 'chapter')} waiting for you.`, pose: 'waving', sparkles: false };
}

export function groupPulseText(pulse: GroupPulse | undefined): string {
  if (!pulse) return 'No activity yet today';
  const parts: string[] = [];
  if (pulse.latestCheckinName) parts.push(`${pulse.latestCheckinName} checked in`);
  if (pulse.newPrayersCount > 0) parts.push(`${pluralize(pulse.newPrayersCount, 'new prayer')}`);
  return parts.length > 0 ? parts.join(' · ') : 'No activity yet today';
}
