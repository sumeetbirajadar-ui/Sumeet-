// Study Session & Focus Tools — timed sessions tagged by subject/chapter,
// with history and time-distribution analytics. Per-student, localStorage.

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

export type FocusMode = '25-5' | '50-10' | '90-ultradian';

export const FOCUS_MODES: Array<{ value: FocusMode; label: string; workMin: number; breakMin: number }> = [
  { value: '25-5', label: '25 / 5 (Pomodoro)', workMin: 25, breakMin: 5 },
  { value: '50-10', label: '50 / 10', workMin: 50, breakMin: 10 },
  { value: '90-ultradian', label: '90 min (deep work)', workMin: 90, breakMin: 20 },
];

export interface StudySession {
  id: string;
  subject: string;
  chapterName: string;
  mode: FocusMode;
  minutes: number;
  distractions: number;
  note: string;
  logDate: string;
  createdAt: string;
}

function key(studentId: string) {
  return `focus_sessions_v1_${studentId}`;
}

export function listSessions(studentId: string): StudySession[] {
  try {
    const raw = localStorage.getItem(key(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logSession(studentId: string, data: Omit<StudySession, 'id' | 'createdAt' | 'logDate'>): StudySession {
  const session: StudySession = { ...data, id: uid('session'), logDate: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() };
  const items = [session, ...listSessions(studentId)];
  localStorage.setItem(key(studentId), JSON.stringify(items));
  return session;
}

export function deleteSession(studentId: string, id: string) {
  localStorage.setItem(key(studentId), JSON.stringify(listSessions(studentId).filter((s) => s.id !== id)));
}

export function minutesToday(studentId: string): number {
  const today = new Date().toISOString().split('T')[0];
  return listSessions(studentId)
    .filter((s) => s.logDate === today)
    .reduce((sum, s) => sum + s.minutes, 0);
}

export function minutesThisWeek(studentId: string): number {
  const sessions = listSessions(studentId);
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const mondayStr = monday.toISOString().split('T')[0];
  return sessions.filter((s) => s.logDate >= mondayStr).reduce((sum, s) => sum + s.minutes, 0);
}

export interface SubjectDistribution {
  subject: string;
  minutes: number;
}

export function subjectDistribution(studentId: string): SubjectDistribution[] {
  const sessions = listSessions(studentId);
  const map = new Map<string, number>();
  sessions.forEach((s) => map.set(s.subject, (map.get(s.subject) || 0) + s.minutes));
  return Array.from(map.entries())
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}
