// Lightweight LMS layer: batches, live-class scheduling, notes/video
// publishing, a PYQ bank, doubt threads and attendance — modelled after the
// "Vijaya Live Classes & LMS" architecture spec's own recommended prototype
// scope (schedule -> publish -> student receives -> attendance/doubts),
// minus anything that needs a paid vendor (real DRM streaming, FCM push,
// signed URLs). Local-storage backed for now; every function here is the
// seam to swap for Firestore reads/writes later without touching callers.

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

// ---------------------------------------------------------------- Batches --

const BATCHES_KEY = 'lms_batches_v1';

export interface Batch {
  id: string;
  name: string;
  examTrack: 'KCET' | 'NEET' | 'JEE' | 'Other';
  year: number;
  createdAt: string;
}

export function listBatches(): Batch[] {
  return load<Batch>(BATCHES_KEY);
}

export function createBatch(name: string, examTrack: Batch['examTrack'], year: number): Batch {
  const batch: Batch = { id: uid('batch'), name, examTrack, year, createdAt: new Date().toISOString() };
  save(BATCHES_KEY, [batch, ...listBatches()]);
  return batch;
}

export function deleteBatch(id: string) {
  save(BATCHES_KEY, listBatches().filter((b) => b.id !== id));
}

// ------------------------------------------------------------ Live classes --

const CLASSES_KEY = 'lms_classes_v1';

export type PublishState = 'draft' | 'scheduled' | 'published' | 'ended';

export interface LiveClass {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  batchIds: string[]; // empty = all students
  scheduledStart: string; // ISO
  joinUrl: string; // external link: Google Meet / YouTube / Zoom, etc.
  publishState: PublishState;
  createdAt: string;
  updatedAt: string;
}

export function listClasses(): LiveClass[] {
  return load<LiveClass>(CLASSES_KEY);
}

export function createClass(data: Omit<LiveClass, 'id' | 'createdAt' | 'updatedAt' | 'publishState'>): LiveClass {
  const now = new Date().toISOString();
  const item: LiveClass = { ...data, id: uid('class'), publishState: 'draft', createdAt: now, updatedAt: now };
  save(CLASSES_KEY, [item, ...listClasses()]);
  return item;
}

export function updateClass(id: string, patch: Partial<LiveClass>) {
  const items = listClasses().map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
  save(CLASSES_KEY, items);
  return items;
}

export function deleteClass(id: string) {
  save(CLASSES_KEY, listClasses().filter((c) => c.id !== id));
}

export function visibleClassesForBatch(batchId: string | null): LiveClass[] {
  return listClasses()
    .filter((c) => c.publishState === 'scheduled' || c.publishState === 'published' || c.publishState === 'ended')
    .filter((c) => c.batchIds.length === 0 || (batchId && c.batchIds.includes(batchId)))
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
}

// --------------------------------------------------------- Content items --

const CONTENT_KEY = 'lms_content_v1';

export interface ContentItem {
  id: string;
  kind: 'note' | 'video';
  title: string;
  subject: string;
  chapter: string;
  url: string;
  batchIds: string[];
  publishState: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export function listContent(): ContentItem[] {
  return load<ContentItem>(CONTENT_KEY);
}

export function createContent(data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'publishState'>): ContentItem {
  const now = new Date().toISOString();
  const item: ContentItem = { ...data, id: uid('content'), publishState: 'draft', createdAt: now, updatedAt: now };
  save(CONTENT_KEY, [item, ...listContent()]);
  return item;
}

export function updateContent(id: string, patch: Partial<ContentItem>) {
  const items = listContent().map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
  save(CONTENT_KEY, items);
  return items;
}

export function deleteContent(id: string) {
  save(CONTENT_KEY, listContent().filter((c) => c.id !== id));
}

export function visibleContentForBatch(batchId: string | null): ContentItem[] {
  return listContent()
    .filter((c) => c.publishState === 'published')
    .filter((c) => c.batchIds.length === 0 || (batchId && c.batchIds.includes(batchId)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// -------------------------------------------------------------- PYQ bank --

const PYQ_KEY = 'lms_pyq_v1';

export interface PyqQuestion {
  id: string;
  exam: string;
  year: number;
  subject: string;
  chapter: string;
  question: string;
  options: string[];
  answerIndex: number;
  createdAt: string;
}

export function listPyq(): PyqQuestion[] {
  return load<PyqQuestion>(PYQ_KEY);
}

export function addPyqQuestions(questions: Array<Omit<PyqQuestion, 'id' | 'createdAt'>>): PyqQuestion[] {
  const now = new Date().toISOString();
  const withIds = questions.map((q) => ({ ...q, id: uid('pyq'), createdAt: now }));
  const items = [...withIds, ...listPyq()];
  save(PYQ_KEY, items);
  return items;
}

export function deletePyq(id: string) {
  save(PYQ_KEY, listPyq().filter((q) => q.id !== id));
}

// -------------------------------------------------------------- Doubts --

const DOUBT_THREADS_KEY = 'lms_doubt_threads_v1';
const DOUBT_MESSAGES_KEY = 'lms_doubt_messages_v1';

export interface DoubtThread {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  status: 'open' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface DoubtMessage {
  id: string;
  threadId: string;
  senderRole: 'student' | 'admin';
  body: string;
  createdAt: string;
}

export function listThreads(): DoubtThread[] {
  return load<DoubtThread>(DOUBT_THREADS_KEY);
}

export function listThreadsForStudent(studentId: string): DoubtThread[] {
  return listThreads()
    .filter((t) => t.studentId === studentId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listAllThreadsGrouped(): DoubtThread[] {
  return listThreads().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listMessages(threadId: string): DoubtMessage[] {
  return load<DoubtMessage>(DOUBT_MESSAGES_KEY)
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createThread(studentId: string, studentName: string, subject: string, firstMessage: string): DoubtThread {
  const now = new Date().toISOString();
  const thread: DoubtThread = { id: uid('thread'), studentId, studentName, subject, status: 'open', createdAt: now, updatedAt: now };
  save(DOUBT_THREADS_KEY, [thread, ...listThreads()]);
  postMessage(thread.id, 'student', firstMessage);
  return thread;
}

export function postMessage(threadId: string, senderRole: 'student' | 'admin', body: string): DoubtMessage {
  const msg: DoubtMessage = { id: uid('msg'), threadId, senderRole, body, createdAt: new Date().toISOString() };
  const all = load<DoubtMessage>(DOUBT_MESSAGES_KEY);
  save(DOUBT_MESSAGES_KEY, [...all, msg]);
  const threads = listThreads().map((t) => (t.id === threadId ? { ...t, updatedAt: msg.createdAt } : t));
  save(DOUBT_THREADS_KEY, threads);
  return msg;
}

export function setThreadStatus(threadId: string, status: DoubtThread['status']) {
  const threads = listThreads().map((t) => (t.id === threadId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
  save(DOUBT_THREADS_KEY, threads);
  return threads;
}

// ---------------------------------------------------------- Attendance --

const ATTENDANCE_KEY = 'lms_attendance_v1';

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  joinedAt: string;
}

export function recordAttendance(classId: string, studentId: string, studentName: string): AttendanceRecord {
  const record: AttendanceRecord = { id: uid('att'), classId, studentId, studentName, joinedAt: new Date().toISOString() };
  const all = load<AttendanceRecord>(ATTENDANCE_KEY);
  save(ATTENDANCE_KEY, [record, ...all]);
  return record;
}

export function attendanceForClass(classId: string): AttendanceRecord[] {
  return load<AttendanceRecord>(ATTENDANCE_KEY).filter((a) => a.classId === classId);
}

export function listAttendance(): AttendanceRecord[] {
  return load<AttendanceRecord>(ATTENDANCE_KEY);
}
