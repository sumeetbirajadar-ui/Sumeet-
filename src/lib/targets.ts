// Weekly & Monthly Targets — small, self-set, self-tracked goals ("100 MCQs
// this week", "4 mock tests this month") with simple progress tracking.
// Per-student, localStorage-backed.

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

export type TargetPeriod = 'weekly' | 'monthly';

export interface Target {
  id: string;
  period: TargetPeriod;
  title: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
  createdAt: string;
}

function key(studentId: string) {
  return `targets_v1_${studentId}`;
}

export function listTargets(studentId: string): Target[] {
  try {
    const raw = localStorage.getItem(key(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(studentId: string, targets: Target[]) {
  localStorage.setItem(key(studentId), JSON.stringify(targets));
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

export function currentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateStr(monday), end: toDateStr(sunday) };
}

export function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toDateStr(first), end: toDateStr(last) };
}

export function createTarget(studentId: string, data: { period: TargetPeriod; title: string; metric: string; targetValue: number }): Target {
  const range = data.period === 'weekly' ? currentWeekRange() : currentMonthRange();
  const target: Target = {
    ...data,
    id: uid('target'),
    currentValue: 0,
    periodStart: range.start,
    periodEnd: range.end,
    createdAt: new Date().toISOString(),
  };
  save(studentId, [...listTargets(studentId), target]);
  return target;
}

export function updateTargetProgress(studentId: string, id: string, currentValue: number) {
  save(studentId, listTargets(studentId).map((t) => (t.id === id ? { ...t, currentValue: Math.max(0, currentValue) } : t)));
}

export function deleteTarget(studentId: string, id: string) {
  save(studentId, listTargets(studentId).filter((t) => t.id !== id));
}

/** Targets whose period window includes today. */
export function activeTargets(studentId: string, period?: TargetPeriod): Target[] {
  const today = toDateStr(new Date());
  return listTargets(studentId).filter((t) => (!period || t.period === period) && t.periodStart <= today && today <= t.periodEnd);
}

export function targetPct(target: Target): number {
  if (target.targetValue <= 0) return 0;
  return Math.min(100, Math.round((target.currentValue / target.targetValue) * 100));
}
