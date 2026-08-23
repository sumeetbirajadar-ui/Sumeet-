// Resource & Book Tracker — a shelf of the standard KCET/NEET/JEE reference
// books, plus a progress marker per book so a student can see what's
// actually been worked through versus just owned. Per-student, localStorage.

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

export interface BookRef {
  id: string;
  title: string;
  author: string;
  subject: string;
  custom?: boolean;
}

export const REFERENCE_BOOKS: BookRef[] = [
  { id: 'hc-verma', title: 'Concepts of Physics (Vol 1 & 2)', author: 'H.C. Verma', subject: 'Physics' },
  { id: 'dc-pandey', title: 'DC Pandey Physics Series', author: 'D.C. Pandey', subject: 'Physics' },
  { id: 'cengage-physics', title: 'Cengage Physics for JEE', author: 'B.M. Sharma', subject: 'Physics' },
  { id: 'irodov', title: 'Problems in General Physics', author: 'I.E. Irodov', subject: 'Physics' },
  { id: 'ms-chouhan', title: 'Organic Chemistry — Problems in Organic Chemistry', author: 'M.S. Chouhan', subject: 'Chemistry' },
  { id: 'jd-lee', title: 'Concise Inorganic Chemistry', author: 'J.D. Lee', subject: 'Chemistry' },
  { id: 'p-bahadur', title: 'Numerical Chemistry', author: 'P. Bahadur', subject: 'Chemistry' },
  { id: 'mtg-neet', title: 'NEET Champion / Fingertips Biology', author: 'MTG Editorial Board', subject: 'Biology' },
];

export type ResourceStatus = 'not_started' | 'in_progress' | 'done';

export interface ResourceProgress {
  bookId: string;
  status: ResourceStatus;
  notes: string;
  updatedAt: string;
}

function customKey(studentId: string) {
  return `resources_custom_v1_${studentId}`;
}
function progressKey(studentId: string) {
  return `resources_progress_v1_${studentId}`;
}

export function listCustomBooks(studentId: string): BookRef[] {
  try {
    const raw = localStorage.getItem(customKey(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomBook(studentId: string, data: { title: string; author: string; subject: string }): BookRef {
  const book: BookRef = { ...data, id: uid('book'), custom: true };
  localStorage.setItem(customKey(studentId), JSON.stringify([...listCustomBooks(studentId), book]));
  return book;
}

export function deleteCustomBook(studentId: string, id: string) {
  localStorage.setItem(customKey(studentId), JSON.stringify(listCustomBooks(studentId).filter((b) => b.id !== id)));
}

export function listAllBooks(studentId: string): BookRef[] {
  return [...REFERENCE_BOOKS, ...listCustomBooks(studentId)];
}

function listProgress(studentId: string): ResourceProgress[] {
  try {
    const raw = localStorage.getItem(progressKey(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getProgress(studentId: string, bookId: string): ResourceProgress {
  return listProgress(studentId).find((p) => p.bookId === bookId) || { bookId, status: 'not_started', notes: '', updatedAt: '' };
}

export function updateProgress(studentId: string, bookId: string, patch: Partial<Pick<ResourceProgress, 'status' | 'notes'>>) {
  const existing = listProgress(studentId);
  const current = existing.find((p) => p.bookId === bookId);
  const updated: ResourceProgress = { ...(current || { bookId, status: 'not_started', notes: '', updatedAt: '' }), ...patch, updatedAt: new Date().toISOString() };
  const rest = existing.filter((p) => p.bookId !== bookId);
  localStorage.setItem(progressKey(studentId), JSON.stringify([...rest, updated]));
}

export interface ProgressSummary {
  total: number;
  done: number;
  inProgress: number;
  notStarted: number;
}

export function progressSummary(studentId: string): ProgressSummary {
  const books = listAllBooks(studentId);
  const statuses = books.map((b) => getProgress(studentId, b.id).status);
  return {
    total: books.length,
    done: statuses.filter((s) => s === 'done').length,
    inProgress: statuses.filter((s) => s === 'in_progress').length,
    notStarted: statuses.filter((s) => s === 'not_started').length,
  };
}
