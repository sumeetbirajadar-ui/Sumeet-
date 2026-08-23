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

// ------------------------------------------------------ PYQ chapter hub --

const CHAPTER_RESOURCES_KEY = 'lms_chapter_resources_v1';

export type ExamTrack = 'KCET' | 'NEET' | 'JEE';

export const EXAM_TRACKS: ExamTrack[] = ['KCET', 'NEET', 'JEE'];

// Standard combined 11th+12th PUC/NCERT Physics chapter list (28 chapters).
// Seeded automatically the first time a track is opened; admin can rename,
// add or remove chapters afterwards, and add other subjects later.
export const DEFAULT_PHYSICS_CHAPTERS = [
  'Physical World',
  'Units and Measurements',
  'Motion in a Straight Line',
  'Motion in a Plane',
  'Laws of Motion',
  'Work, Energy and Power',
  'System of Particles and Rotational Motion',
  'Gravitation',
  'Mechanical Properties of Solids',
  'Mechanical Properties of Fluids',
  'Thermal Properties of Matter',
  'Thermodynamics',
  'Kinetic Theory of Gases',
  'Oscillations and Waves',
  'Electric Charges and Fields',
  'Electrostatic Potential and Capacitance',
  'Current Electricity',
  'Moving Charges and Magnetism',
  'Magnetism and Matter',
  'Electromagnetic Induction',
  'Alternating Current',
  'Electromagnetic Waves',
  'Ray Optics and Optical Instruments',
  'Wave Optics',
  'Dual Nature of Radiation and Matter',
  'Atoms',
  'Nuclei',
  'Semiconductor Electronics',
];

export interface ChapterResource {
  id: string;
  examTrack: ExamTrack;
  subject: string;
  chapterIndex: number;
  chapterName: string;
  notesUrl: string; // Google Drive (or any) link to notes
  solutionVideoUrl: string; // YouTube link — solved PYQs for this chapter
  conceptVideoUrl: string; // YouTube link — important topics/sub-topics explained
  ncertUrl: string; // Official NCERT chapter link
  updatedAt: string;
}

function seedChapterResources(examTrack: ExamTrack, subject: string): ChapterResource[] {
  const now = new Date().toISOString();
  return DEFAULT_PHYSICS_CHAPTERS.map((name, i) => ({
    id: uid('chres'),
    examTrack,
    subject,
    chapterIndex: i + 1,
    chapterName: name,
    notesUrl: '',
    solutionVideoUrl: '',
    conceptVideoUrl: '',
    ncertUrl: '',
    updatedAt: now,
  }));
}

export function listChapterResources(examTrack: ExamTrack, subject = 'Physics'): ChapterResource[] {
  const all = load<ChapterResource>(CHAPTER_RESOURCES_KEY);
  const existing = all.filter((c) => c.examTrack === examTrack && c.subject === subject);
  if (existing.length > 0) return existing.sort((a, b) => a.chapterIndex - b.chapterIndex);
  if (subject !== 'Physics') return [];
  // First visit to this track: auto-seed the standard Physics chapter list.
  const seeded = seedChapterResources(examTrack, subject);
  save(CHAPTER_RESOURCES_KEY, [...all, ...seeded]);
  return seeded;
}

export function updateChapterResource(id: string, patch: Partial<Pick<ChapterResource, 'chapterName' | 'notesUrl' | 'solutionVideoUrl' | 'conceptVideoUrl' | 'ncertUrl'>>) {
  const all = load<ChapterResource>(CHAPTER_RESOURCES_KEY);
  const items = all.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
  save(CHAPTER_RESOURCES_KEY, items);
  return items;
}

export function addChapter(examTrack: ExamTrack, subject: string, chapterName: string): ChapterResource {
  const all = load<ChapterResource>(CHAPTER_RESOURCES_KEY);
  const forTrack = all.filter((c) => c.examTrack === examTrack && c.subject === subject);
  const chapter: ChapterResource = {
    id: uid('chres'),
    examTrack,
    subject,
    chapterIndex: forTrack.length + 1,
    chapterName,
    notesUrl: '',
    solutionVideoUrl: '',
    conceptVideoUrl: '',
    ncertUrl: '',
    updatedAt: new Date().toISOString(),
  };
  save(CHAPTER_RESOURCES_KEY, [...all, chapter]);
  return chapter;
}

export function deleteChapter(id: string) {
  save(CHAPTER_RESOURCES_KEY, load<ChapterResource>(CHAPTER_RESOURCES_KEY).filter((c) => c.id !== id));
}

/** Latest timestamp across anything a student would care about seeing — used to show a "new" badge. */
export function latestActivityAt(): string {
  const timestamps: string[] = [];
  listClasses()
    .filter((c) => c.publishState === 'scheduled' || c.publishState === 'published')
    .forEach((c) => timestamps.push(c.updatedAt));
  listContent()
    .filter((c) => c.publishState === 'published')
    .forEach((c) => timestamps.push(c.updatedAt));
  load<ChapterResource>(CHAPTER_RESOURCES_KEY)
    .filter((c) => c.notesUrl || c.solutionVideoUrl || c.conceptVideoUrl || c.ncertUrl)
    .forEach((c) => timestamps.push(c.updatedAt));
  return timestamps.sort().pop() || '';
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
