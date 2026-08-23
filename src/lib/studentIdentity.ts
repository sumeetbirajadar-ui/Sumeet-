// Stable per-device student identity, used to scope doubt threads and
// attendance records. There's no real multi-device account system yet
// (that needs the Firebase auth layer), so this id is per-browser.

const ID_KEY = 'student_id';
const BATCH_KEY = 'student_batch_id';

export function getOrCreateStudentId(): string {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = `student_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    localStorage.setItem(ID_KEY, id);
  }
  return id;
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
