// Error Log — a running record of mistakes made in practice/mocks, tagged by
// cause, so a student can see their own recurring failure patterns instead of
// re-learning the same lesson every attempt. Per-student, localStorage-backed.

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

export type MistakeType = 'conceptual' | 'calculation' | 'silly' | 'time-pressure' | 'unread-question' | 'guessed-wrong';

export const MISTAKE_TYPES: Array<{ value: MistakeType; label: string }> = [
  { value: 'conceptual', label: 'Conceptual gap' },
  { value: 'calculation', label: 'Calculation error' },
  { value: 'silly', label: 'Silly mistake' },
  { value: 'time-pressure', label: 'Time pressure' },
  { value: 'unread-question', label: 'Misread the question' },
  { value: 'guessed-wrong', label: 'Guessed wrong' },
];

export interface ErrorLogEntry {
  id: string;
  subject: string;
  chapterName: string;
  questionSummary: string;
  mistakeType: MistakeType;
  correctApproach: string;
  resolved: boolean;
  date: string;
  createdAt: string;
}

function key(studentId: string) {
  return `error_log_v1_${studentId}`;
}

export function listErrors(studentId: string): ErrorLogEntry[] {
  try {
    const raw = localStorage.getItem(key(studentId));
    const items: ErrorLogEntry[] = raw ? JSON.parse(raw) : [];
    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch {
    return [];
  }
}

export function addError(studentId: string, data: Omit<ErrorLogEntry, 'id' | 'createdAt'>): ErrorLogEntry {
  const entry: ErrorLogEntry = { ...data, id: uid('err'), createdAt: new Date().toISOString() };
  localStorage.setItem(key(studentId), JSON.stringify([...listErrors(studentId), entry]));
  return entry;
}

export function updateError(studentId: string, id: string, patch: Partial<ErrorLogEntry>) {
  localStorage.setItem(key(studentId), JSON.stringify(listErrors(studentId).map((e) => (e.id === id ? { ...e, ...patch } : e))));
}

export function deleteError(studentId: string, id: string) {
  localStorage.setItem(key(studentId), JSON.stringify(listErrors(studentId).filter((e) => e.id !== id)));
}

export interface CountBucket {
  label: string;
  count: number;
}

export function errorsByType(studentId: string): CountBucket[] {
  const errors = listErrors(studentId);
  return MISTAKE_TYPES.map((t) => ({ label: t.label, count: errors.filter((e) => e.mistakeType === t.value).length })).filter((b) => b.count > 0);
}

export function weakestChapters(studentId: string, limit = 5): CountBucket[] {
  const errors = listErrors(studentId).filter((e) => !e.resolved);
  const map = new Map<string, number>();
  errors.forEach((e) => {
    if (!e.chapterName) return;
    map.set(e.chapterName, (map.get(e.chapterName) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function unresolvedCount(studentId: string): number {
  return listErrors(studentId).filter((e) => !e.resolved).length;
}
