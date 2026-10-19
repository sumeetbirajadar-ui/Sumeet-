// College management layer for the admin (principal) side: sections,
// students, lecturers, twice-daily section attendance, staff attendance,
// lecturer work logs, fee payments and section transfers — the same feature
// set as a PU-college principal dashboard. Everything here is admin-only in
// firestore.rules: students' phone numbers, fees and attendance are not
// something other students should be able to read.

import { subscribeCollection, addDocument, updateDocument, deleteDocument, subscribeDoc, setDocument } from './firebase';

export const YEARS = ['1st PUC', '2nd PUC'] as const;
export type Year = (typeof YEARS)[number];
export type Session = 'morning' | 'evening';

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isSunday(date: string): boolean {
  return new Date(`${date}T00:00:00`).getDay() === 0;
}

// --------------------------------------------------------------- Sections --

const SECTIONS = 'college_sections';

export interface Section {
  id: string;
  name: string;
  year: Year;
  classTeacherId: string; // lecturer id, '' = not assigned
  createdAt: string;
}

export function subscribeSections(onData: (items: Section[]) => void): () => void {
  return subscribeCollection<Omit<Section, 'id'>>(SECTIONS, (items) =>
    onData([...items].sort((a, b) => a.year.localeCompare(b.year) || a.name.localeCompare(b.name)))
  );
}

export async function createSection(name: string, year: Year): Promise<void> {
  await addDocument(SECTIONS, { name, year, classTeacherId: '', createdAt: new Date().toISOString() });
}

export async function updateSection(id: string, patch: Partial<Omit<Section, 'id'>>): Promise<void> {
  await updateDocument(SECTIONS, id, patch);
}

export async function deleteSection(id: string): Promise<void> {
  await deleteDocument(SECTIONS, id);
}

// --------------------------------------------------------------- Students --

const STUDENTS = 'college_students';

export interface CollegeStudent {
  id: string;
  name: string;
  registerNo: string;
  sectionId: string;
  phone: string; // parent's phone
  hostel: boolean;
  active: boolean;
  totalFee: number;
  createdAt: string;
}

export function subscribeStudents(onData: (items: CollegeStudent[]) => void): () => void {
  return subscribeCollection<Omit<CollegeStudent, 'id'>>(STUDENTS, (items) =>
    onData([...items].sort((a, b) => a.registerNo.localeCompare(b.registerNo) || a.name.localeCompare(b.name)))
  );
}

export async function createStudent(data: Omit<CollegeStudent, 'id' | 'createdAt' | 'active'>): Promise<void> {
  await addDocument(STUDENTS, { ...data, active: true, createdAt: new Date().toISOString() });
}

export async function updateStudent(id: string, patch: Partial<Omit<CollegeStudent, 'id'>>): Promise<void> {
  await updateDocument(STUDENTS, id, patch);
}

export async function deleteStudent(id: string): Promise<void> {
  await deleteDocument(STUDENTS, id);
}

// Bulk add from pasted lines: "Register No, Name, Phone" per line.
export function parseStudentLines(text: string): Array<{ registerNo: string; name: string; phone: string }> {
  return text
    .split('\n')
    .map((line) => line.split(/[,\t]/).map((s) => s.trim()))
    .filter((parts) => parts.length >= 2 && parts[1])
    .map(([registerNo, name, phone = '']) => ({ registerNo, name, phone }));
}

// ------------------------------------------------------ Section transfers --

const TRANSFERS = 'college_section_transfers';

export interface SectionTransfer {
  id: string;
  studentId: string;
  fromSectionId: string;
  toSectionId: string;
  at: string;
}

export function subscribeTransfers(onData: (items: SectionTransfer[]) => void): () => void {
  return subscribeCollection<Omit<SectionTransfer, 'id'>>(TRANSFERS, (items) =>
    onData([...items].sort((a, b) => b.at.localeCompare(a.at)))
  );
}

export async function transferStudent(student: CollegeStudent, toSectionId: string): Promise<void> {
  await updateStudent(student.id, { sectionId: toSectionId });
  await addDocument(TRANSFERS, {
    studentId: student.id,
    fromSectionId: student.sectionId,
    toSectionId,
    at: new Date().toISOString(),
  });
}

// -------------------------------------------------------------- Lecturers --

const LECTURERS = 'college_lecturers';

export interface Lecturer {
  id: string;
  name: string;
  subject: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

export function subscribeLecturers(onData: (items: Lecturer[]) => void): () => void {
  return subscribeCollection<Omit<Lecturer, 'id'>>(LECTURERS, (items) =>
    onData([...items].sort((a, b) => a.name.localeCompare(b.name)))
  );
}

export async function createLecturer(name: string, subject: string, phone: string): Promise<void> {
  await addDocument(LECTURERS, { name, subject, phone, active: true, createdAt: new Date().toISOString() });
}

export async function updateLecturer(id: string, patch: Partial<Omit<Lecturer, 'id'>>): Promise<void> {
  await updateDocument(LECTURERS, id, patch);
}

export async function deleteLecturer(id: string): Promise<void> {
  await deleteDocument(LECTURERS, id);
}

// ------------------------------------------------- Student attendance ------

// One doc per (date, section, session), id `${date}_${sectionId}_${session}`,
// so re-marking the same session overwrites instead of duplicating. Stores
// only who was absent — everyone else active in the section was present.
const ATTENDANCE = 'college_attendance';

export interface SectionAttendance {
  id: string;
  date: string;
  sectionId: string;
  session: Session;
  absentIds: string[];
  markedBy: string;
  markedAt: string;
  corrected: boolean; // true once a saved session has been changed
}

export function subscribeAttendance(onData: (items: SectionAttendance[]) => void): () => void {
  return subscribeCollection<Omit<SectionAttendance, 'id'>>(ATTENDANCE, onData);
}

export async function saveAttendance(
  existing: SectionAttendance | undefined,
  date: string,
  sectionId: string,
  session: Session,
  absentIds: string[],
  markedBy: string
): Promise<void> {
  await setDocument(ATTENDANCE, `${date}_${sectionId}_${session}`, {
    date,
    sectionId,
    session,
    absentIds,
    markedBy,
    markedAt: new Date().toISOString(),
    corrected: Boolean(existing),
  });
}

// Percentage of marked sessions a student was present for, in [from, to].
export function attendancePercent(
  student: CollegeStudent,
  records: SectionAttendance[],
  from: string,
  to: string
): { held: number; present: number; pct: number | null } {
  const mine = records.filter((r) => r.sectionId === student.sectionId && r.date >= from && r.date <= to);
  const present = mine.filter((r) => !r.absentIds.includes(student.id)).length;
  return { held: mine.length, present, pct: mine.length ? Math.round((present / mine.length) * 100) : null };
}

// ------------------------------------------------------ Staff attendance ---

// One doc per date: lecturerId -> present?
const STAFF_ATTENDANCE = 'college_staff_attendance';

export interface StaffAttendanceDay {
  id: string;
  present: Record<string, boolean>;
}

export function subscribeStaffAttendance(onData: (items: StaffAttendanceDay[]) => void): () => void {
  return subscribeCollection<Omit<StaffAttendanceDay, 'id'>>(STAFF_ATTENDANCE, onData);
}

export async function saveStaffAttendance(date: string, present: Record<string, boolean>): Promise<void> {
  await setDocument(STAFF_ATTENDANCE, date, { present });
}

// --------------------------------------------------------------- Work log --

const WORK_LOGS = 'college_work_logs';

export interface WorkLog {
  id: string;
  lecturerId: string;
  sectionId: string;
  date: string;
  hours: number;
  topic: string;
  createdAt: string;
}

export function subscribeWorkLogs(onData: (items: WorkLog[]) => void): () => void {
  return subscribeCollection<Omit<WorkLog, 'id'>>(WORK_LOGS, (items) =>
    onData([...items].sort((a, b) => b.date.localeCompare(a.date)))
  );
}

export async function addWorkLog(data: Omit<WorkLog, 'id' | 'createdAt'>): Promise<void> {
  await addDocument(WORK_LOGS, { ...data, createdAt: new Date().toISOString() });
}

export async function deleteWorkLog(id: string): Promise<void> {
  await deleteDocument(WORK_LOGS, id);
}

// ------------------------------------------------------------------- Fees --

const FEE_PAYMENTS = 'college_fee_payments';

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

export function subscribeFeePayments(onData: (items: FeePayment[]) => void): () => void {
  return subscribeCollection<Omit<FeePayment, 'id'>>(FEE_PAYMENTS, (items) =>
    onData([...items].sort((a, b) => b.date.localeCompare(a.date)))
  );
}

export async function addFeePayment(data: Omit<FeePayment, 'id' | 'createdAt'>): Promise<void> {
  await addDocument(FEE_PAYMENTS, { ...data, createdAt: new Date().toISOString() });
}

export async function deleteFeePayment(id: string): Promise<void> {
  await deleteDocument(FEE_PAYMENTS, id);
}

// --------------------------------------------------------------- Settings --

const SETTINGS_PATH = 'college_settings';
const SETTINGS_ID = 'main';

export interface CollegeSettings {
  sundayAttendance: boolean;
}

export function subscribeCollegeSettings(onData: (s: CollegeSettings) => void): () => void {
  return subscribeDoc<CollegeSettings>(SETTINGS_PATH, SETTINGS_ID, (s) => onData(s ?? { sundayAttendance: false }));
}

export async function saveCollegeSettings(s: CollegeSettings): Promise<void> {
  await setDocument(SETTINGS_PATH, SETTINGS_ID, s);
}

// ---------------------------------------------------------------- Export --

export function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
