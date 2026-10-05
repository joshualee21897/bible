// Remembers the highest garden level each person has already seen
// celebrated, per group, so the "Our garden grew!" moment only shows once
// per level per device — the same localStorage trick used for the Read
// tab's "last left off" position.

const PREFIX = 'sprout:lastSeenLevel:';

export function getLastSeenLevel(groupId: string): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  try {
    const raw = window.localStorage.getItem(PREFIX + groupId);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function setLastSeenLevel(groupId: string, levelIndex: number): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(PREFIX + groupId, String(levelIndex));
  } catch {
    // Ignore write failures (e.g. private browsing) — not worth surfacing.
  }
}
