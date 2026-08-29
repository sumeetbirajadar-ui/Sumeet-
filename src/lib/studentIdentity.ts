// Student identity, used to scope doubt threads, attendance records, and
// every personal-tracker localStorage key. A logged-in student's Firebase
// Auth uid (see studentAuth.ts) takes priority once they've registered/
// logged in, so their data follows the account across devices via
// cloudSync.ts. Falls back to a random per-device id for anyone who
// hasn't created an account yet (or for the admin/combined-mode fallback).

const ID_KEY = 'student_id';
const UID_KEY = 'student_uid';
const BATCH_KEY = 'student_batch_id';
const LMS_SEEN_KEY = 'student_lms_last_seen';

export function getOrCreateStudentId(): string {
  const uid = localStorage.getItem(UID_KEY);
  if (uid) return uid;
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = `student_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function setStudentUid(uid: string | null) {
  if (uid) localStorage.setItem(UID_KEY, uid);
  else localStorage.removeItem(UID_KEY);
}

export function getStudentUid(): string | null {
  return localStorage.getItem(UID_KEY);
}

export function getStudentName(): string {
  return localStorage.getItem('student_name') || 'Student';
}

export function getStudentBatchId(): string | null {
  return localStorage.getItem(BATCH_KEY);
}

export function setStudentBatchId(batchId: string | null) {
  if (batchId) localStorage.setItem(BATCH_KEY, batchId);
  else localStorage.removeItem(BATCH_KEY);
}

export function getLmsLastSeen(): string {
  return localStorage.getItem(LMS_SEEN_KEY) || '';
}

export function markLmsSeen() {
  localStorage.setItem(LMS_SEEN_KEY, new Date().toISOString());
}
