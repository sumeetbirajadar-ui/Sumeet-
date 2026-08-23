// Counselling companion: a document-readiness checklist (per student), an
// admin-managed timeline of counselling dates per exam track, and a personal
// seat-allotment log each student keeps for their own records. All
// local-storage backed, same pattern as the rest of the LMS layer.

import { ExamTrack } from './lms';

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

// ------------------------------------------------------- Document checklist --

export const STANDARD_DOCUMENTS = [
  'SSLC / 10th marks card',
  '2nd PUC / 12th marks card',
  'Study certificate (BEO/DDPI countersigned)',
  'Category certificate (if applicable)',
  'Income certificate (if applicable)',
  'Fee payment receipt',
  'KCET application printout',
  'Passport-size photographs',
];

function checklistKey(studentId: string) {
  return `counselling_documents_v1_${studentId}`;
}

export function getDocumentChecklist(studentId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(checklistKey(studentId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function toggleDocument(studentId: string, doc: string) {
  const checklist = getDocumentChecklist(studentId);
  checklist[doc] = !checklist[doc];
  localStorage.setItem(checklistKey(studentId), JSON.stringify(checklist));
  return checklist;
}

// ---------------------------------------------------------------- Timeline --

const TIMELINE_KEY = 'counselling_timeline_v1';

export interface TimelineEvent {
  id: string;
  examTrack: ExamTrack;
  title: string;
  date: string; // ISO date, e.g. 2026-09-15
  note?: string;
}

export function listTimelineEvents(examTrack?: ExamTrack): TimelineEvent[] {
  const all = load<TimelineEvent>(TIMELINE_KEY);
  const filtered = examTrack ? all.filter((e) => e.examTrack === examTrack) : all;
  return filtered.sort((a, b) => a.date.localeCompare(b.date));
}

export function addTimelineEvent(examTrack: ExamTrack, title: string, date: string, note?: string): TimelineEvent {
  const event: TimelineEvent = { id: uid('tl'), examTrack, title, date, note };
  save(TIMELINE_KEY, [...load<TimelineEvent>(TIMELINE_KEY), event]);
  return event;
}

export function deleteTimelineEvent(id: string) {
  save(TIMELINE_KEY, load<TimelineEvent>(TIMELINE_KEY).filter((e) => e.id !== id));
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ----------------------------------------------------------- Allotment log --

function allotmentKey(studentId: string) {
  return `counselling_allotments_v1_${studentId}`;
}

export interface AllotmentRecord {
  id: string;
  examTrack: ExamTrack;
  round: string; // e.g. "Round 1", "Round 2", "Mock", "Mop-up"
  rank: string;
  college: string;
  branch: string;
  category: string;
  createdAt: string;
}

export function listAllotments(studentId: string): AllotmentRecord[] {
  return load<AllotmentRecord>(allotmentKey(studentId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addAllotment(studentId: string, data: Omit<AllotmentRecord, 'id' | 'createdAt'>): AllotmentRecord {
  const record: AllotmentRecord = { ...data, id: uid('allot'), createdAt: new Date().toISOString() };
  const key = allotmentKey(studentId);
  save(key, [record, ...load<AllotmentRecord>(key)]);
  return record;
}

export function deleteAllotment(studentId: string, id: string) {
  const key = allotmentKey(studentId);
  save(key, load<AllotmentRecord>(key).filter((r) => r.id !== id));
}
