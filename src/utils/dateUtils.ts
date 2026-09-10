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
