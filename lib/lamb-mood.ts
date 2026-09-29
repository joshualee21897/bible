import type { LambMood } from '../components/pixel/lamb-sprites';

const NIGHT_START_HOUR = 21;
const NIGHT_END_HOUR = 6;

// Sleeping (local clock) beats waiting beats happy — happy is the default
// when nothing else says otherwise.
export function getLambMood(hasCheckedInToday: boolean, now: Date = new Date()): LambMood {
  const hour = now.getHours();
  const isNight = hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
  if (isNight) return 'sleeping';
  if (!hasCheckedInToday) return 'waiting';
  return 'happy';
}
