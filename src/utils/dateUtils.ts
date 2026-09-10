import { DayDelivery, MealTiming } from '../types';

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayDateKey(): string {
  return formatDateKey(new Date());
}

// Inclusive list of date keys from `fromKey` to `toKey` (YYYY-MM-DD, either order).
export function getDateKeyRange(fromKey: string, toKey: string): string[] {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  let start = new Date(fy, fm - 1, fd);
  let end = new Date(ty, tm - 1, td);
  if (start > end) {
    [start, end] = [end, start];
  }
  const keys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

// Finds the next contiguous block of "on leave" days for a customer, starting
// from `fromDateKey` (default today) and looking up to `maxDaysAhead` days out.
// A day counts as "on leave" only if every session that applies to this
// customer's meal timing is marked 'leave' that day. Returns null if no
// upcoming/current leave block is found.
export function findUpcomingLeaveRange(
  customerId: string,
  dayDeliveries: Record<string, DayDelivery>,
  mealTiming: MealTiming,
  fromDateKey: string = getTodayDateKey(),
  maxDaysAhead: number = 180
): { from: string; to: string } | null {
  const morningApplicable = mealTiming === 'both' || mealTiming === 'morning';
  const eveningApplicable = mealTiming === 'both' || mealTiming === 'night';
  const todayKey = getTodayDateKey();

  const isLeaveDay = (dateKey: string): boolean => {
    const rec = dayDeliveries[`${dateKey}_${customerId}`] || (dateKey === todayKey ? dayDeliveries[customerId] : undefined);
    if (!rec) return false;
    const morningOk = !morningApplicable || rec.morning?.status === 'leave';
    const eveningOk = !eveningApplicable || rec.evening?.status === 'leave';
    return morningOk && eveningOk;
  };

  const [fy, fm, fd] = fromDateKey.split('-').map(Number);
  const cursor = new Date(fy, fm - 1, fd);
  let from: string | null = null;
  let to: string | null = null;

  for (let i = 0; i < maxDaysAhead; i++) {
    const key = formatDateKey(cursor);
    if (isLeaveDay(key)) {
      if (!from) from = key;
      to = key;
    } else if (from) {
      break;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return from && to ? { from, to } : null;
}
