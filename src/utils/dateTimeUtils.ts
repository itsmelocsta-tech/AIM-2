import { ScheduleItem, TodayScheduleSections } from '../types';

/**
 * Returns the effective user IANA timezone or device timezone
 */
export function getEffectiveTimeZone(userTimeZone?: string): string {
  if (userTimeZone && typeof userTimeZone === 'string') {
    try {
      // Test if timezone is valid
      Intl.DateTimeFormat(undefined, { timeZone: userTimeZone });
      return userTimeZone;
    } catch {
      // Fallback if invalid
    }
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Gets the current date string in YYYY-MM-DD for the given timezone
 */
export function getTodayDateString(timeZone?: string): string {
  const tz = getEffectiveTimeZone(timeZone);
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const part = (type: 'year' | 'month' | 'day') => parts.find(item => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * Formats day of week, e.g. "Wednesday"
 */
export function formatDayOfWeek(date: Date = new Date(), timeZone?: string): string {
  const tz = getEffectiveTimeZone(timeZone);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
  }).format(date);
}

/**
 * Formats full local date, e.g. "August 26, 2026"
 */
export function formatFullLocalDate(date: Date = new Date(), timeZone?: string): string {
  const tz = getEffectiveTimeZone(timeZone);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats local time, e.g. "2:34 PM"
 */
export function formatLocalTime(date: Date = new Date(), timeZone?: string): string {
  const tz = getEffectiveTimeZone(timeZone);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a time range from ISO UTC strings into local time strings
 * e.g. "9:00 AM – 10:30 AM"
 */
export function formatTimeRange(startAt: string, endAt: string, timeZone?: string): string {
  const tz = getEffectiveTimeZone(timeZone);
  try {
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const startTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(startDate);
    const endTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(endDate);
    return `${startTimeStr} – ${endTimeStr}`;
  } catch {
    return 'Scheduled';
  }
}

/**
 * Converts a date and local hour/minute (e.g. "09:00") into a UTC ISO string
 */
export function createUtcIsoFromLocal(
  dateStr: string, // YYYY-MM-DD
  timeStr: string, // HH:mm (24-hour)
  timeZone?: string
): string {
  const tz = getEffectiveTimeZone(timeZone);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const [year, month, day] = dateStr.split('-').map(Number);

  // We construct a date representing this local wall-clock time
  const tempDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  
  // Refine using Intl to match target timezone offset accurately
  try {
    const localStr = tempDate.toLocaleString('en-US', { timeZone: tz });
    const localParsed = new Date(localStr);
    const diff = tempDate.getTime() - localParsed.getTime();
    return new Date(tempDate.getTime() + diff).toISOString();
  } catch {
    return tempDate.toISOString();
  }
}

/**
 * Groups schedule items into Earlier, Current, and Upcoming sections
 * based on the current moment.
 */
export function groupScheduleItems(
  items: ScheduleItem[],
  now: Date = new Date()
): TodayScheduleSections {
  if (!items || items.length === 0) {
    return { earlier: [], current: null, upcoming: [] };
  }

  // Sort chronologically by startAt
  const sorted = [...items].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  const nowMs = now.getTime();
  const earlier: ScheduleItem[] = [];
  let current: ScheduleItem | null = null;
  const upcoming: ScheduleItem[] = [];

  for (const item of sorted) {
    const startMs = new Date(item.startAt).getTime();
    const endMs = new Date(item.endAt).getTime();

    // In progress or active right now
    if (item.status === 'in_progress' && !current) {
      current = item;
    } else if (startMs <= nowMs && nowMs < endMs && !current) {
      current = item;
    } else if (endMs <= nowMs) {
      earlier.push(item);
    } else {
      upcoming.push(item);
    }
  }

  return { earlier, current, upcoming };
}

/**
 * Finds the current active item or the next upcoming item
 */
export function findActiveOrNextItem(
  items: ScheduleItem[],
  now: Date = new Date()
): { current: ScheduleItem | null; next: ScheduleItem | null; isDayComplete: boolean } {
  if (!items || items.length === 0) {
    return { current: null, next: null, isDayComplete: false };
  }

  const { earlier, current, upcoming } = groupScheduleItems(items, now);

  if (current) {
    return { current, next: upcoming[0] || null, isDayComplete: false };
  }

  if (upcoming.length > 0) {
    return { current: null, next: upcoming[0], isDayComplete: false };
  }

  // If no current and no upcoming, check if all items are completed or earlier
  const allEarlierOrCompleted = items.every(
    (item) => item.status === 'completed' || new Date(item.endAt).getTime() <= now.getTime()
  );

  return { current: null, next: null, isDayComplete: allEarlierOrCompleted };
}
