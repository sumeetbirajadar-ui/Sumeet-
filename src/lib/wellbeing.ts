// Wellbeing Journal — a non-clinical daily mood/stress/sleep check-in. This
// is a self-reflection tool, not a diagnostic one: it never withholds
// streaks or shames a missed day, and it gently signposts real professional
// support (Tele MANAS) when the signal suggests a student may need more
// than an app. Per-student, localStorage-backed.

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: number; // 1-5
  stressLevel: number; // 1-5
  sleepHours: number | null;
  gratitude: string;
  notes: string;
  createdAt: string;
}

function key(studentId: string) {
  return `wellbeing_journal_v1_${studentId}`;
}

function todayStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function listEntries(studentId: string): JournalEntry[] {
  try {
    const raw = localStorage.getItem(key(studentId));
    const items: JournalEntry[] = raw ? JSON.parse(raw) : [];
    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch {
    return [];
  }
}

export function todayEntry(studentId: string): JournalEntry | undefined {
  return listEntries(studentId).find((e) => e.date === todayStr());
}

export function saveTodayEntry(studentId: string, data: Omit<JournalEntry, 'id' | 'date' | 'createdAt'>): JournalEntry {
  const existing = todayEntry(studentId);
  const entries = listEntries(studentId);
  if (existing) {
    const updated = entries.map((e) => (e.id === existing.id ? { ...e, ...data } : e));
    localStorage.setItem(key(studentId), JSON.stringify(updated));
    return { ...existing, ...data };
  }
  const entry: JournalEntry = { ...data, id: uid('journal'), date: todayStr(), createdAt: new Date().toISOString() };
  localStorage.setItem(key(studentId), JSON.stringify([...entries, entry]));
  return entry;
}

export function deleteEntry(studentId: string, id: string) {
  localStorage.setItem(key(studentId), JSON.stringify(listEntries(studentId).filter((e) => e.id !== id)));
}

export interface StressPoint {
  date: string;
  stressLevel: number;
}

export function recentStressTrend(studentId: string, days = 7): StressPoint[] {
  const entries = listEntries(studentId);
  const out: StressPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = todayStr(-i);
    const entry = entries.find((e) => e.date === date);
    out.push({ date, stressLevel: entry ? entry.stressLevel : 0 });
  }
  return out;
}

const DISTRESS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'end my life', 'want to die',
  'no point living', 'no point in living', 'self harm', 'self-harm', 'hopeless', 'worthless',
];

function containsDistressLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return DISTRESS_KEYWORDS.some((k) => lower.includes(k));
}

export const TELE_MANAS_MESSAGE =
  'If things have been feeling heavier than usual, please reach out — Tele MANAS: 14416 (free, confidential, 24/7), or talk to a parent, teacher, or trusted adult. You do not have to carry this alone.';

/** True if stress has been high for several days running, or recent notes suggest real distress — never used to break streaks or otherwise penalise. */
export function needsSupportSignal(studentId: string): boolean {
  const entries = listEntries(studentId);
  const latest = entries[0];
  if (latest && (containsDistressLanguage(latest.notes) || containsDistressLanguage(latest.gratitude))) return true;

  const recent = recentStressTrend(studentId, 3);
  return recent.every((p) => p.stressLevel >= 4);
}
