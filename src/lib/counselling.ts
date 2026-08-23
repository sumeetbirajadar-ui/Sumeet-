// Counselling companion: a document-readiness checklist (per student), an
// admin-managed timeline of counselling dates per exam track, and a personal
// seat-allotment log each student keeps for their own records. All
// local-storage backed, same pattern as the rest of the LMS layer.

import { ExamTrack } from './lms';
import { subscribeCollection, addDocument, deleteDocument } from './firebase';
import { where } from 'firebase/firestore';

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
// Admin-authored counselling dates, shared across every student's device.

const TIMELINE_COLLECTION = 'counselling_timeline';

export interface TimelineEvent {
  id: string;
  examTrack: ExamTrack;
  title: string;
  date: string; // ISO date, e.g. 2026-09-15
  note?: string;
}

export function subscribeTimelineEvents(onData: (items: TimelineEvent[]) => void, examTrack?: ExamTrack): () => void {
  const constraints = examTrack ? [where('examTrack', '==', examTrack)] : [];
  return subscribeCollection<Omit<TimelineEvent, 'id'>>(
    TIMELINE_COLLECTION,
    (items) => onData([...items].sort((a, b) => a.date.localeCompare(b.date))),
    ...constraints
  );
}

export async function addTimelineEvent(examTrack: ExamTrack, title: string, date: string, note?: string): Promise<void> {
  await addDocument(TIMELINE_COLLECTION, { examTrack, title, date, note: note ?? null });
}

export async function deleteTimelineEvent(id: string): Promise<void> {
  await deleteDocument(TIMELINE_COLLECTION, id);
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
