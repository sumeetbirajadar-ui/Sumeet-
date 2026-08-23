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
// Researched against KEA (KCET), MCC/NTA (NEET UG) and NTA (JEE Main) official
// requirements. Application docs (needed to fill the online form) and
// counselling docs (needed to carry in person for verification/seat
// confirmation) are genuinely different lists, so they're kept separate.

export type DocumentCategory = 'kcetApplication' | 'kcetCounselling' | 'neetApplication' | 'neetCounselling' | 'jeeApplication';

export const DOCUMENT_CATEGORIES: { key: DocumentCategory; label: string; hint: string }[] = [
  { key: 'kcetApplication', label: 'KCET Application', hint: 'To fill the KEA online application form' },
  { key: 'kcetCounselling', label: 'KCET Counselling', hint: 'To carry for document verification & seat allotment' },
  { key: 'neetApplication', label: 'NEET Application', hint: 'To fill the NTA NEET (UG) online form' },
  { key: 'neetCounselling', label: 'NEET Counselling', hint: 'For MCC / state counselling verification & admission' },
  { key: 'jeeApplication', label: 'JEE Main Application', hint: 'To fill the NTA JEE Main online form' },
];

export const DOCUMENTS_BY_CATEGORY: Record<DocumentCategory, string[]> = {
  kcetApplication: [
    'Aadhaar card (for Aadhaar-based verification)',
    'SSLC / 10th marks card (date of birth & marks)',
    '2nd PUC / 12th marks card (or admit card, if result awaited)',
    'Recent passport-size photograph — JPG, white background, under 50 KB',
    "Scanned signature — JPG, under 50 KB",
    'Left thumb impression (scanned)',
    "Parent/guardian's signature or thumb impression",
    'Category/caste certificate with RD number (if claiming reservation)',
    'Income certificate with RD number (if claiming reservation)',
    'Rural study / Kannada medium (Gadinadu/Horanadu Kannadiga) certificate, if claiming that benefit',
    'Active mobile number & email ID for OTP verification',
  ],
  kcetCounselling: [
    'KCET admit card (hall ticket)',
    'KCET rank card / scorecard',
    'KCET application form printout',
    'Aadhaar card',
    'SSLC / 10th marks card & certificate',
    '2nd PUC / 12th marks card & certificate',
    '7-year study certificate (Karnataka domicile proof)',
    'Transfer certificate (TC)',
    'Caste certificate with RD number (if applicable)',
    'Income certificate with RD number (if applicable)',
    'Rural study / Kannada medium certificate, if claimed',
    '6-8 passport-size photographs',
    'Fee payment receipt / DD as instructed by KEA',
    'Originals plus 2-3 self-attested photocopy sets of every document',
  ],
  neetApplication: [
    'Aadhaar card (or other NTA-accepted photo ID)',
    'Class 10 marksheet & certificate (date of birth proof)',
    'Class 12 marksheet & certificate (or admit card, if appearing)',
    'Recent passport-size photograph as per NTA size/format spec',
    'Scanned signature as per NTA size/format spec',
    'Left thumb impression (scanned)',
    'Category certificate — SC/ST/OBC-NCL/EWS, if applicable',
    'PwBD certificate, if applicable',
    'Present & permanent address proof, merged into a single PDF',
    'Nationality/citizenship proof, for NRI/OCI/foreign national candidates',
  ],
  neetCounselling: [
    'NEET admit card',
    'NEET UG scorecard / rank letter',
    'Provisional seat allotment letter (MCC or state portal printout, current round only)',
    'Class 10 marksheet & certificate',
    'Class 12 marksheet & certificate',
    'Category certificate — SC/ST/OBC-NCL/EWS, if applicable',
    'Domicile / state-eligibility certificate, for state-quota seats',
    'NRI/OCI sponsorship affidavit & supporting proof, if applicable',
    'PwBD certificate, if applicable',
    '6-8 passport-size photographs',
    'Valid photo ID proof (Aadhaar/passport)',
    'Migration certificate, if the admitting college requires it',
    'Originals plus 3-5 self-attested photocopy sets of every document',
  ],
  jeeApplication: [
    'Aadhaar card (or other NTA-accepted photo ID)',
    'Class 10 marksheet & certificate (date of birth proof)',
    'Class 12 marksheet & certificate (or admit card, if appearing)',
    'Passport-size photograph — JPEG, 10-200 KB, white background, 80% face visible',
    'Scanned signature — JPEG, 4-50 KB, 3.5cm x 1.5cm, on white paper',
    'Category certificate — SC/ST/OBC-NCL/EWS, if applicable',
    'PwD certificate, if applicable',
    'Active mobile number & email ID for OTP verification',
  ],
};

function checklistKey(studentId: string, category: DocumentCategory) {
  return `counselling_documents_v2_${category}_${studentId}`;
}

export function getDocumentChecklist(studentId: string, category: DocumentCategory): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(checklistKey(studentId, category));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function toggleDocument(studentId: string, category: DocumentCategory, doc: string) {
  const checklist = getDocumentChecklist(studentId, category);
  checklist[doc] = !checklist[doc];
  localStorage.setItem(checklistKey(studentId, category), JSON.stringify(checklist));
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
