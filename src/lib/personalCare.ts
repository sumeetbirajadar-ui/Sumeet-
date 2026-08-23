// Personal Care Tracker — the basics that keep a body able to study: water,
// sleep, movement, eye breaks, sunlight, real food. Simple daily checklist,
// no streaks to punish. Per-student, localStorage-backed.

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

export interface CareItem {
  id: string;
  label: string;
  sortOrder: number;
}

export interface CareLog {
  itemId: string;
  date: string; // YYYY-MM-DD
  done: boolean;
}

function itemsKey(studentId: string) {
  return `personal_care_items_v1_${studentId}`;
}
function logsKey(studentId: string) {
  return `personal_care_log_v1_${studentId}`;
}

const STARTER_ITEMS = [
  '8 glasses of water',
  '7+ hours of sleep',
  '20 min movement or exercise',
  'An eye break every hour of screen time',
  '10 min of sunlight',
  'At least one home-cooked meal',
];

export function listCareItems(studentId: string): CareItem[] {
  try {
    const raw = localStorage.getItem(itemsKey(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function seedStarterCareItems(studentId: string) {
  if (listCareItems(studentId).length > 0) return;
  const items: CareItem[] = STARTER_ITEMS.map((label, i) => ({ id: uid('care'), label, sortOrder: i }));
  localStorage.setItem(itemsKey(studentId), JSON.stringify(items));
}

export function listLogs(studentId: string): CareLog[] {
  try {
    const raw = localStorage.getItem(logsKey(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(studentId: string, logs: CareLog[]) {
  localStorage.setItem(logsKey(studentId), JSON.stringify(logs));
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function isDoneToday(studentId: string, itemId: string): boolean {
  return listLogs(studentId).some((l) => l.itemId === itemId && l.date === todayStr() && l.done);
}

export function toggleCareLog(studentId: string, itemId: string) {
  const date = todayStr();
  const logs = listLogs(studentId);
  const existing = logs.find((l) => l.itemId === itemId && l.date === date);
  if (existing) {
    saveLogs(studentId, logs.map((l) => (l.itemId === itemId && l.date === date ? { ...l, done: !l.done } : l)));
  } else {
    saveLogs(studentId, [...logs, { itemId, date, done: true }]);
  }
}

export function todayCompletionPct(studentId: string): number {
  const items = listCareItems(studentId);
  if (items.length === 0) return 0;
  const done = items.filter((i) => isDoneToday(studentId, i.id)).length;
  return Math.round((done / items.length) * 100);
}
