// Plain-language times for lists: "Just now", "5 min ago", "2h ago", "Yesterday", "3 days ago",
// then the date.

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function timeAgo(iso: string, now: number = Date.now()): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return '';
  const diff = Math.max(0, now - at);
  if (diff < MIN) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MIN)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  // calendar days, not 24-hour blocks: 23:00 last night is "Yesterday" at 07:00 this morning
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY);
  if (days <= 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
