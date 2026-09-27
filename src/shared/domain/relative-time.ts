
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const JUST_NOW_THRESHOLD = 45 * SECOND;

const ABSOLUTE_DATE_THRESHOLD = 7 * DAY;

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'} ago`;
}

export function formatRelativeTime(value: Date, now: Date = new Date()): string {
  const elapsed = now.getTime() - value.getTime();

  if (elapsed < 0) {
    return 'just now';
  }

  if (elapsed < JUST_NOW_THRESHOLD) {
    return 'just now';
  }

  if (elapsed < HOUR) {
    // The 45–59 second interval must read "1 min ago", not "0 mins ago".
    return plural(Math.max(1, Math.floor(elapsed / MINUTE)), 'min');
  }

  if (elapsed < DAY) {
    return plural(Math.floor(elapsed / HOUR), 'hour');
  }

  if (elapsed < ABSOLUTE_DATE_THRESHOLD) {
    return plural(Math.floor(elapsed / DAY), 'day');
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

export function toDateTimeAttribute(value: Date): string {
  return value.toISOString();
}
