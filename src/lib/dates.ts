// Day keys look like "2026-11-12" and always use the phone's local time.

export function dayKey(d: Date | number = new Date()): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

// Whole days from a to b (b - a). Uses noon to avoid daylight-saving issues.
export function diffDays(a: string, b: string): number {
  const da = keyToDate(a);
  const db = keyToDate(b);
  da.setHours(12);
  db.setHours(12);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function shortDay(key: string): string {
  return keyToDate(key).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2);
}

export function timeOf(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
