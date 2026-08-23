// Lightweight LMS layer: batches, live-class scheduling, notes/video
// publishing, a PYQ bank, doubt threads and attendance — modelled after the
// "Vijaya Live Classes & LMS" architecture spec's own recommended prototype
// scope (schedule -> publish -> student receives -> attendance/doubts),
// minus anything that needs a paid vendor (real DRM streaming, FCM push,
// signed URLs). Firestore-backed: this is admin-authored (or admin-visible)
// content shared across every student's device, unlike the personal
// tracker data (habits, journal, mock tests, etc.) which stays local.

import { subscribeCollection, addDocument, updateDocument, deleteDocument, db } from './firebase';
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';

// ---------------------------------------------------------------- Batches --

const BATCHES_COLLECTION = 'lms_batches';

export interface Batch {
  id: string;
  name: string;
  examTrack: 'KCET' | 'NEET' | 'JEE' | 'Other';
  year: number;
  createdAt: string;
}

export function subscribeBatches(onData: (items: Batch[]) => void): () => void {
  return subscribeCollection<Omit<Batch, 'id'>>(BATCHES_COLLECTION, (items) => {
    onData([...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });
}

export async function createBatch(name: string, examTrack: Batch['examTrack'], year: number): Promise<void> {
  await addDocument(BATCHES_COLLECTION, { name, examTrack, year, createdAt: new Date().toISOString() });
}

export async function deleteBatch(id: string): Promise<void> {
  await deleteDocument(BATCHES_COLLECTION, id);
}

// ------------------------------------------------------------ Live classes --

const CLASSES_COLLECTION = 'lms_classes';

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

export function subscribeClasses(onData: (items: LiveClass[]) => void): () => void {
  return subscribeCollection<Omit<LiveClass, 'id'>>(CLASSES_COLLECTION, onData);
}

export async function createClass(data: Omit<LiveClass, 'id' | 'createdAt' | 'updatedAt' | 'publishState'>): Promise<void> {
  const now = new Date().toISOString();
  await addDocument(CLASSES_COLLECTION, { ...data, publishState: 'draft', createdAt: now, updatedAt: now });
}

export async function updateClass(id: string, patch: Partial<LiveClass>): Promise<void> {
  await updateDocument(CLASSES_COLLECTION, id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteClass(id: string): Promise<void> {
  await deleteDocument(CLASSES_COLLECTION, id);
}

export function visibleClassesForBatch(classes: LiveClass[], batchId: string | null): LiveClass[] {
  return classes
    .filter((c) => c.publishState === 'scheduled' || c.publishState === 'published' || c.publishState === 'ended')
    .filter((c) => c.batchIds.length === 0 || (batchId && c.batchIds.includes(batchId)))
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
}

// --------------------------------------------------------- Content items --

const CONTENT_COLLECTION = 'lms_content';

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

export function subscribeContent(onData: (items: ContentItem[]) => void): () => void {
  return subscribeCollection<Omit<ContentItem, 'id'>>(CONTENT_COLLECTION, onData);
}

export async function createContent(data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'publishState'>): Promise<void> {
  const now = new Date().toISOString();
  await addDocument(CONTENT_COLLECTION, { ...data, publishState: 'draft', createdAt: now, updatedAt: now });
}

export async function updateContent(id: string, patch: Partial<ContentItem>): Promise<void> {
  await updateDocument(CONTENT_COLLECTION, id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteContent(id: string): Promise<void> {
  await deleteDocument(CONTENT_COLLECTION, id);
}

export function visibleContentForBatch(items: ContentItem[], batchId: string | null): ContentItem[] {
  return items
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

// Standard combined 11th+12th PUC/NCERT Chemistry chapter list.
export const DEFAULT_CHEMISTRY_CHAPTERS = [
  'Some Basic Concepts of Chemistry',
  'Structure of Atom',
  'Classification of Elements and Periodicity',
  'Chemical Bonding and Molecular Structure',
  'States of Matter',
  'Thermodynamics (Chemistry)',
  'Equilibrium',
  'Redox Reactions',
  'Hydrogen',
  'The s-Block Elements',
  'The p-Block Elements (Groups 13 & 14)',
  'Organic Chemistry — Basic Principles and Techniques',
  'Hydrocarbons',
  'Environmental Chemistry',
  'Solid State',
  'Solutions',
  'Electrochemistry',
  'Chemical Kinetics',
  'Surface Chemistry',
  'General Principles of Isolation of Elements',
  'The p-Block Elements (Groups 15-18)',
  'The d and f Block Elements',
  'Coordination Compounds',
  'Haloalkanes and Haloarenes',
  'Alcohols, Phenols and Ethers',
  'Aldehydes, Ketones and Carboxylic Acids',
  'Amines',
  'Biomolecules (Chemistry)',
  'Polymers',
  'Chemistry in Everyday Life',
];

// Standard combined 11th+12th PUC/NCERT Biology chapter list.
export const DEFAULT_BIOLOGY_CHAPTERS = [
  'The Living World',
  'Biological Classification',
  'Plant Kingdom',
  'Animal Kingdom',
  'Morphology of Flowering Plants',
  'Anatomy of Flowering Plants',
  'Structural Organisation in Animals',
  'Cell: The Unit of Life',
  'Biomolecules (Biology)',
  'Cell Cycle and Cell Division',
  'Transport in Plants',
  'Mineral Nutrition',
  'Photosynthesis in Higher Plants',
  'Respiration in Plants',
  'Plant Growth and Development',
  'Digestion and Absorption',
  'Breathing and Exchange of Gases',
  'Body Fluids and Circulation',
  'Excretory Products and their Elimination',
  'Locomotion and Movement',
  'Neural Control and Coordination',
  'Chemical Coordination and Integration',
  'Reproduction in Organisms',
  'Sexual Reproduction in Flowering Plants',
  'Human Reproduction',
  'Reproductive Health',
  'Principles of Inheritance and Variation',
  'Molecular Basis of Inheritance',
  'Evolution',
  'Human Health and Disease',
  'Microbes in Human Welfare',
  'Biotechnology: Principles and Processes',
  'Biotechnology and its Applications',
  'Organisms and Populations',
  'Ecosystem',
  'Biodiversity and Conservation',
];

// Standard combined 11th+12th PUC/NCERT Maths chapter list.
export const DEFAULT_MATHS_CHAPTERS = [
  'Sets',
  'Relations and Functions',
  'Trigonometric Functions',
  'Complex Numbers and Quadratic Equations',
  'Linear Inequalities',
  'Permutations and Combinations',
  'Binomial Theorem',
  'Sequences and Series',
  'Straight Lines',
  'Conic Sections',
  'Introduction to Three Dimensional Geometry',
  'Limits and Derivatives',
  'Statistics',
  'Probability',
  'Relations and Functions (Inverse Trigonometric Functions)',
  'Matrices',
  'Determinants',
  'Continuity and Differentiability',
  'Applications of Derivatives',
  'Integrals',
  'Applications of Integrals',
  'Differential Equations',
  'Vector Algebra',
  'Three Dimensional Geometry',
  'Linear Programming',
  'Probability (Class 12)',
];

export const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Maths'] as const;
export type Subject = (typeof SUBJECTS)[number];

export const SUBJECT_CHAPTERS: Record<Subject, string[]> = {
  Physics: DEFAULT_PHYSICS_CHAPTERS,
  Chemistry: DEFAULT_CHEMISTRY_CHAPTERS,
  Biology: DEFAULT_BIOLOGY_CHAPTERS,
  Maths: DEFAULT_MATHS_CHAPTERS,
};

// Which exams actually examine each subject — Maths has no NEET paper,
// Biology has no JEE paper. Physics and Chemistry are common to all three.
export const SUBJECT_EXAM_TRACKS: Record<Subject, ExamTrack[]> = {
  Physics: ['KCET', 'NEET', 'JEE'],
  Chemistry: ['KCET', 'NEET', 'JEE'],
  Maths: ['KCET', 'JEE'],
  Biology: ['KCET', 'NEET'],
};

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

const CHAPTER_RESOURCES_COLLECTION = 'lms_chapter_resources';

/** Live-subscribes to one exam/subject's chapters, auto-seeding the standard list the first time anyone opens a track/subject that has no chapters yet. */
export function subscribeChapterResources(examTrack: ExamTrack, subject: Subject, onData: (items: ChapterResource[]) => void): () => void {
  if (!SUBJECT_EXAM_TRACKS[subject].includes(examTrack)) {
    onData([]);
    return () => {};
  }
  let seeded = false;
  return subscribeCollection<Omit<ChapterResource, 'id'>>(
    CHAPTER_RESOURCES_COLLECTION,
    (items) => {
      const forTrack = items.filter((c) => c.examTrack === examTrack && c.subject === subject);
      if (forTrack.length === 0 && !seeded) {
        seeded = true;
        ensureChapterResourcesSeeded(examTrack, subject);
      }
      onData(forTrack.sort((a, b) => a.chapterIndex - b.chapterIndex));
    },
    where('examTrack', '==', examTrack),
    where('subject', '==', subject)
  );
}

async function ensureChapterResourcesSeeded(examTrack: ExamTrack, subject: Subject): Promise<void> {
  if (!db) return;
  const q = query(collection(db, CHAPTER_RESOURCES_COLLECTION), where('examTrack', '==', examTrack), where('subject', '==', subject));
  const existing = await getDocs(q);
  if (!existing.empty) return; // someone else already seeded it just now
  const now = new Date().toISOString();
  const batch = writeBatch(db);
  SUBJECT_CHAPTERS[subject].forEach((name, i) => {
    const ref = doc(collection(db!, CHAPTER_RESOURCES_COLLECTION));
    batch.set(ref, {
      examTrack,
      subject,
      chapterIndex: i + 1,
      chapterName: name,
      notesUrl: '',
      solutionVideoUrl: '',
      conceptVideoUrl: '',
      ncertUrl: '',
      updatedAt: now,
    });
  });
  await batch.commit();
}

export async function updateChapterResource(id: string, patch: Partial<Pick<ChapterResource, 'chapterName' | 'notesUrl' | 'solutionVideoUrl' | 'conceptVideoUrl' | 'ncertUrl'>>): Promise<void> {
  await updateDocument(CHAPTER_RESOURCES_COLLECTION, id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function addChapter(examTrack: ExamTrack, subject: string, chapterName: string, currentCount: number): Promise<void> {
  await addDocument(CHAPTER_RESOURCES_COLLECTION, {
    examTrack,
    subject,
    chapterIndex: currentCount + 1,
    chapterName,
    notesUrl: '',
    solutionVideoUrl: '',
    conceptVideoUrl: '',
    ncertUrl: '',
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteChapter(id: string): Promise<void> {
  await deleteDocument(CHAPTER_RESOURCES_COLLECTION, id);
}

/** Latest timestamp across the classes/content arrays a caller already has subscribed to — used to show a "new" badge on the Learning Hub card. */
export function latestActivityAt(classes: LiveClass[], content: ContentItem[]): string {
  const timestamps: string[] = [];
  classes.filter((c) => c.publishState === 'scheduled' || c.publishState === 'published').forEach((c) => timestamps.push(c.updatedAt));
  content.filter((c) => c.publishState === 'published').forEach((c) => timestamps.push(c.updatedAt));
  return timestamps.sort().pop() || '';
}

// -------------------------------------------------------------- Doubts --

const DOUBT_THREADS_COLLECTION = 'lms_doubt_threads';
const DOUBT_MESSAGES_COLLECTION = 'lms_doubt_messages';

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

export function subscribeThreadsForStudent(studentId: string, onData: (items: DoubtThread[]) => void): () => void {
  return subscribeCollection<Omit<DoubtThread, 'id'>>(
    DOUBT_THREADS_COLLECTION,
    (items) => onData([...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))),
    where('studentId', '==', studentId)
  );
}

export function subscribeAllThreadsGrouped(onData: (items: DoubtThread[]) => void): () => void {
  return subscribeCollection<Omit<DoubtThread, 'id'>>(DOUBT_THREADS_COLLECTION, (items) =>
    onData([...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  );
}

export function subscribeMessages(threadId: string, onData: (items: DoubtMessage[]) => void): () => void {
  return subscribeCollection<Omit<DoubtMessage, 'id'>>(
    DOUBT_MESSAGES_COLLECTION,
    (items) => onData([...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt))),
    where('threadId', '==', threadId)
  );
}

export async function createThread(studentId: string, studentName: string, subject: string, firstMessage: string): Promise<void> {
  const now = new Date().toISOString();
  const threadId = await addDocument(DOUBT_THREADS_COLLECTION, { studentId, studentName, subject, status: 'open', createdAt: now, updatedAt: now });
  await postMessage(threadId, 'student', firstMessage);
}

export async function postMessage(threadId: string, senderRole: 'student' | 'admin', body: string): Promise<void> {
  const now = new Date().toISOString();
  await addDocument(DOUBT_MESSAGES_COLLECTION, { threadId, senderRole, body, createdAt: now });
  await updateDocument(DOUBT_THREADS_COLLECTION, threadId, { updatedAt: now });
}

export async function setThreadStatus(threadId: string, status: DoubtThread['status']): Promise<void> {
  await updateDocument(DOUBT_THREADS_COLLECTION, threadId, { status, updatedAt: new Date().toISOString() });
}

// ---------------------------------------------------------- Attendance --

const ATTENDANCE_COLLECTION = 'lms_attendance';

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  joinedAt: string;
}

export async function recordAttendance(classId: string, studentId: string, studentName: string): Promise<void> {
  await addDocument(ATTENDANCE_COLLECTION, { classId, studentId, studentName, joinedAt: new Date().toISOString() });
}

export function subscribeAttendanceForClass(classId: string, onData: (items: AttendanceRecord[]) => void): () => void {
  return subscribeCollection<Omit<AttendanceRecord, 'id'>>(ATTENDANCE_COLLECTION, onData, where('classId', '==', classId));
}

export function subscribeAllAttendance(onData: (items: AttendanceRecord[]) => void): () => void {
  return subscribeCollection<Omit<AttendanceRecord, 'id'>>(ATTENDANCE_COLLECTION, onData);
}
