// Mock Test Tracker — logs full-length/sectional mock results per exam,
// with each exam's real marking scheme, trend and subject-average analytics.
// Per-student, localStorage-backed.

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

export type MockExamType = 'NEET' | 'JEE Main' | 'KCET' | 'JEE Advanced';

export const MOCK_EXAM_TYPES: MockExamType[] = ['NEET', 'JEE Main', 'KCET', 'JEE Advanced'];

export interface MarkingScheme {
  totalMarks: number;
  totalQuestions: number;
  correctMarks: number;
  incorrectMarks: number; // negative
  note: string;
}

export const MARKING_SCHEMES: Record<MockExamType, MarkingScheme> = {
  NEET: { totalMarks: 720, totalQuestions: 180, correctMarks: 4, incorrectMarks: -1, note: '+4 for correct, -1 for incorrect, 0 unattempted' },
  'JEE Main': { totalMarks: 300, totalQuestions: 90, correctMarks: 4, incorrectMarks: -1, note: '+4 for correct (MCQ), -1 for incorrect; numeric-answer questions have no negative marking' },
  KCET: { totalMarks: 180, totalQuestions: 180, correctMarks: 1, incorrectMarks: 0, note: '+1 for correct, no negative marking' },
  'JEE Advanced': { totalMarks: 360, totalQuestions: 54, correctMarks: 0, incorrectMarks: 0, note: 'Variable partial-marking per section — enter your score manually' },
};

export interface MockTestResult {
  id: string;
  examType: MockExamType;
  testName: string;
  date: string; // YYYY-MM-DD
  totalMarks: number;
  scoredMarks: number;
  physicsMarks: number | null;
  chemistryMarks: number | null;
  mathsMarks: number | null;
  biologyMarks: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
  unattemptedCount: number | null;
  timeTakenMin: number | null;
  notes: string;
  createdAt: string;
}

function key(studentId: string) {
  return `mock_tests_v1_${studentId}`;
}

export function listResults(studentId: string): MockTestResult[] {
  try {
    const raw = localStorage.getItem(key(studentId));
    const items: MockTestResult[] = raw ? JSON.parse(raw) : [];
    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch {
    return [];
  }
}

export function addResult(studentId: string, data: Omit<MockTestResult, 'id' | 'createdAt'>): MockTestResult {
  const result: MockTestResult = { ...data, id: uid('mock'), createdAt: new Date().toISOString() };
  const items = [...listResults(studentId), result];
  localStorage.setItem(key(studentId), JSON.stringify(items));
  return result;
}

export function deleteResult(studentId: string, id: string) {
  localStorage.setItem(key(studentId), JSON.stringify(listResults(studentId).filter((r) => r.id !== id)));
}

export function pctOf(result: MockTestResult): number {
  if (result.totalMarks <= 0) return 0;
  return Math.round((result.scoredMarks / result.totalMarks) * 1000) / 10;
}

export function averagePct(studentId: string, examType?: MockExamType): number {
  const results = listResults(studentId).filter((r) => !examType || r.examType === examType);
  if (results.length === 0) return 0;
  return Math.round((results.reduce((sum, r) => sum + pctOf(r), 0) / results.length) * 10) / 10;
}

export function bestPct(studentId: string, examType?: MockExamType): number {
  const results = listResults(studentId).filter((r) => !examType || r.examType === examType);
  if (results.length === 0) return 0;
  return Math.max(...results.map(pctOf));
}

export interface TrendPoint {
  date: string;
  testName: string;
  pct: number;
}

export function trendData(studentId: string, examType?: MockExamType): TrendPoint[] {
  return listResults(studentId)
    .filter((r) => !examType || r.examType === examType)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((r) => ({ date: r.date, testName: r.testName, pct: pctOf(r) }));
}

export interface SubjectAverage {
  subject: string;
  avgMarks: number;
  count: number;
}

export function subjectAverages(studentId: string, examType?: MockExamType): SubjectAverage[] {
  const results = listResults(studentId).filter((r) => !examType || r.examType === examType);
  const subjects: Array<{ subject: string; field: keyof MockTestResult }> = [
    { subject: 'Physics', field: 'physicsMarks' },
    { subject: 'Chemistry', field: 'chemistryMarks' },
    { subject: 'Maths', field: 'mathsMarks' },
    { subject: 'Biology', field: 'biologyMarks' },
  ];
  return subjects
    .map(({ subject, field }) => {
      const vals = results.map((r) => r[field]).filter((v): v is number => typeof v === 'number');
      return { subject, avgMarks: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0, count: vals.length };
    })
    .filter((s) => s.count > 0);
}
