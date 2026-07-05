export function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function weekKeyFor(dateISO: string): string {
  const d = new Date(dateISO);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return toISODate(monday);
}

export function monthKeyFor(dateISO: string): string {
  return dateISO.slice(0, 7);
}

export function datesInWeek(weekKeyISO: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) out.push(addDays(weekKeyISO, i));
  return out;
}

export function datesInMonth(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const out: string[] = [];
  for (let i = 1; i <= days; i++) out.push(`${monthKey}-${String(i).padStart(2, '0')}`);
  return out;
}

export function lastNDates(n: number, fromISO: string = toISODate(new Date())): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(fromISO, -i));
  return out;
}

export function formatFriendly(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatShort(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function isDueOnWeekday(weekDays: number[] | undefined, dateISO: string): boolean {
  if (!weekDays || !weekDays.length) return true;
  return weekDays.includes(new Date(dateISO).getDay());
}
