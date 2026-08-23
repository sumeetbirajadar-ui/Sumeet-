// Daily Habit & Routine Tracker — Atomic Habits-style identity habits,
// cue/routine/reward, 2-minute versions, "never miss twice" recovery, and a
// don't-break-the-chain heatmap. Per-student, localStorage-backed.

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

export interface Habit {
  id: string;
  name: string;
  identityStatement: string;
  cue: string;
  routine: string;
  reward: string;
  twoMinVersion: string;
  keystone: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  done: boolean;
}

function habitsKey(studentId: string) {
  return `habits_list_v1_${studentId}`;
}
function logsKey(studentId: string) {
  return `habits_log_v1_${studentId}`;
}

const STARTER_HABITS: Array<Pick<Habit, 'name' | 'identityStatement' | 'cue' | 'routine' | 'reward' | 'twoMinVersion' | 'keystone'>> = [
  {
    name: 'Wake up by 5 AM',
    identityStatement: 'I am someone who owns their mornings.',
    cue: 'Alarm rings',
    routine: 'Get out of bed immediately, no snoozing',
    reward: 'Quiet, uninterrupted first hour of the day',
    twoMinVersion: 'Just sit up and turn the alarm off — don’t lie back down.',
    keystone: true,
  },
  {
    name: '100 MCQs solved',
    identityStatement: 'I am someone who practises daily, not just before exams.',
    cue: 'After the morning study block',
    routine: 'Solve 100 MCQs from any subject',
    reward: 'Tick the box, see the streak grow',
    twoMinVersion: 'Just solve 5 questions.',
    keystone: false,
  },
  {
    name: 'Revise due chapters',
    identityStatement: 'I am someone who never lets a revision slip.',
    cue: 'Evening study block',
    routine: 'Clear the "Due for Revision" queue in the Syllabus Tracker',
    reward: 'A clean revision queue for tomorrow',
    twoMinVersion: 'Just open the queue and review one chapter.',
    keystone: false,
  },
];

export function listHabits(studentId: string): Habit[] {
  try {
    const raw = localStorage.getItem(habitsKey(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHabits(studentId: string, habits: Habit[]) {
  localStorage.setItem(habitsKey(studentId), JSON.stringify(habits));
}

export function seedStarterHabits(studentId: string) {
  if (listHabits(studentId).length > 0) return;
  const now = new Date().toISOString();
  const habits: Habit[] = STARTER_HABITS.map((h, i) => ({
    ...h,
    id: uid('habit'),
    active: true,
    sortOrder: i,
    createdAt: now,
  }));
  saveHabits(studentId, habits);
}

export function createHabit(studentId: string, data: Omit<Habit, 'id' | 'active' | 'sortOrder' | 'createdAt'>): Habit {
  const habits = listHabits(studentId);
  const habit: Habit = { ...data, id: uid('habit'), active: true, sortOrder: habits.length, createdAt: new Date().toISOString() };
  saveHabits(studentId, [...habits, habit]);
  return habit;
}

export function updateHabit(studentId: string, id: string, patch: Partial<Habit>) {
  saveHabits(studentId, listHabits(studentId).map((h) => (h.id === id ? { ...h, ...patch } : h)));
}

export function deleteHabit(studentId: string, id: string) {
  saveHabits(studentId, listHabits(studentId).filter((h) => h.id !== id));
}

export function listLogs(studentId: string): HabitLog[] {
  try {
    const raw = localStorage.getItem(logsKey(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(studentId: string, logs: HabitLog[]) {
  localStorage.setItem(logsKey(studentId), JSON.stringify(logs));
}

export function isDoneOn(studentId: string, habitId: string, date: string): boolean {
  return listLogs(studentId).some((l) => l.habitId === habitId && l.date === date && l.done);
}

export function toggleHabitLog(studentId: string, habitId: string, date: string) {
  const logs = listLogs(studentId);
  const existing = logs.find((l) => l.habitId === habitId && l.date === date);
  if (existing) {
    saveLogs(
      studentId,
      logs.map((l) => (l.habitId === habitId && l.date === date ? { ...l, done: !l.done } : l))
    );
  } else {
    saveLogs(studentId, [...logs, { habitId, date, done: true }]);
  }
}

function todayStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/** Current consecutive-day streak ending today (or yesterday, if today isn't logged yet). */
export function currentStreak(studentId: string, habitId: string): number {
  let streak = 0;
  let offset = isDoneOn(studentId, habitId, todayStr(0)) ? 0 : -1;
  if (offset === -1 && !isDoneOn(studentId, habitId, todayStr(-1))) return 0;
  while (isDoneOn(studentId, habitId, todayStr(offset))) {
    streak++;
    offset--;
  }
  return streak;
}

/** True if the habit was missed yesterday but done the day before — the single-miss recovery moment. */
export function needsRecovery(studentId: string, habitId: string): boolean {
  const doneToday = isDoneOn(studentId, habitId, todayStr(0));
  const doneYesterday = isDoneOn(studentId, habitId, todayStr(-1));
  const doneDayBefore = isDoneOn(studentId, habitId, todayStr(-2));
  return !doneToday && !doneYesterday && doneDayBefore;
}

export interface HeatmapDay {
  date: string;
  pct: number; // 0-1 fraction of active habits done that day
}

export function heatmapData(studentId: string, days = 84): HeatmapDay[] {
  const habits = listHabits(studentId).filter((h) => h.active);
  const logs = listLogs(studentId);
  const out: HeatmapDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = todayStr(-i);
    const doneCount = habits.filter((h) => logs.some((l) => l.habitId === h.id && l.date === date && l.done)).length;
    out.push({ date, pct: habits.length > 0 ? doneCount / habits.length : 0 });
  }
  return out;
}

export function weeklyCompletionPct(studentId: string): number {
  const habits = listHabits(studentId).filter((h) => h.active);
  if (habits.length === 0) return 0;
  const logs = listLogs(studentId);
  let done = 0;
  const total = habits.length * 7;
  for (let i = 0; i < 7; i++) {
    const date = todayStr(-i);
    done += habits.filter((h) => logs.some((l) => l.habitId === h.id && l.date === date && l.done)).length;
  }
  return Math.round((done / total) * 100);
}
