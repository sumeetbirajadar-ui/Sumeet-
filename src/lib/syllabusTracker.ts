// Syllabus Completion Tracker — the "track a chapter once, it counts toward
// every exam that shares it" system. Chapter progress is stored once per
// student (not per exam track) across all four subjects, since a chapter
// counts toward every exam that actually examines that subject (see
// SUBJECT_EXAM_TRACKS in lms.ts — Maths has no NEET paper, Biology no JEE
// paper) — mark a chapter done and it counts toward every relevant exam at
// once, matching how a student actually studies.

import { EXAM_TRACKS, ExamTrack, Subject, SUBJECTS, SUBJECT_CHAPTERS, SUBJECT_EXAM_TRACKS } from './lms';

export type ChapterStatus = 'not_started' | 'in_progress' | 'done';

export interface ChapterProgress {
  chapterName: string;
  chapterIndex: number;
  subject: string;
  status: ChapterStatus;
  completionPct: number;
  confidence: number; // 0 = unrated, 1-5 stars
  questionsPracticed: number;
  targetDate: string;
  notes: string;
  updatedAt: string;
}

export interface RevisionCycle {
  chapterName: string;
  cycleNo: number; // index into REVISION_LADDER_DAYS
  dueDate: string; // ISO date
  done: boolean;
  doneDate?: string;
}

// The evidence-based 1-3-7-15-30 day expanding ladder: a chapter marked done
// gets resurfaced at each of these offsets so retrieval practice beats the
// forgetting curve, without needing full SM-2 spaced-repetition bookkeeping.
export const REVISION_LADDER_DAYS = [1, 3, 7, 15, 30];

function progressKey(studentId: string) {
  return `syllabus_progress_v1_${studentId}`;
}

function revisionKey(studentId: string) {
  return `syllabus_revision_v1_${studentId}`;
}

function defaultProgress(): ChapterProgress[] {
  const now = new Date().toISOString();
  const items: ChapterProgress[] = [];
  SUBJECTS.forEach((subject) => {
    SUBJECT_CHAPTERS[subject].forEach((name, i) => {
      items.push({
        chapterName: name,
        chapterIndex: i + 1,
        subject,
        status: 'not_started' as ChapterStatus,
        completionPct: 0,
        confidence: 0,
        questionsPracticed: 0,
        targetDate: '',
        notes: '',
        updatedAt: now,
      });
    });
  });
  return items;
}

export function listChapterProgress(studentId: string): ChapterProgress[] {
  try {
    const raw = localStorage.getItem(progressKey(studentId));
    if (raw) {
      const saved: ChapterProgress[] = JSON.parse(raw);
      // Merge in any chapters added to the canonical list since the student last opened this.
      const byName = new Map(saved.map((c) => [c.chapterName, c]));
      const merged = defaultProgress().map((d) => byName.get(d.chapterName) || d);
      return merged;
    }
  } catch {
    // fall through to defaults
  }
  return defaultProgress();
}

function saveProgress(studentId: string, items: ChapterProgress[]) {
  localStorage.setItem(progressKey(studentId), JSON.stringify(items));
}

function listRevisions(studentId: string): RevisionCycle[] {
  try {
    const raw = localStorage.getItem(revisionKey(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRevisions(studentId: string, items: RevisionCycle[]) {
  localStorage.setItem(revisionKey(studentId), JSON.stringify(items));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function updateChapterProgress(
  studentId: string,
  chapterName: string,
  patch: Partial<Pick<ChapterProgress, 'status' | 'completionPct' | 'confidence' | 'questionsPracticed' | 'targetDate' | 'notes'>>
): ChapterProgress[] {
  const items = listChapterProgress(studentId);
  const wasDone = items.find((c) => c.chapterName === chapterName)?.status === 'done';
  const updated = items.map((c) => (c.chapterName === chapterName ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
  saveProgress(studentId, updated);

  // Marking a chapter done for the first time schedules its revision ladder.
  if (patch.status === 'done' && !wasDone) {
    const today = new Date().toISOString().split('T')[0];
    const existing = listRevisions(studentId).filter((r) => r.chapterName !== chapterName);
    const scheduled = REVISION_LADDER_DAYS.map((offset, i) => ({
      chapterName,
      cycleNo: i,
      dueDate: addDays(today, offset),
      done: false,
    }));
    saveRevisions(studentId, [...existing, ...scheduled]);
  }
  // Un-marking done clears its revision schedule.
  if (patch.status && patch.status !== 'done' && wasDone) {
    saveRevisions(studentId, listRevisions(studentId).filter((r) => r.chapterName !== chapterName));
  }

  return updated;
}

export function getDueRevisions(studentId: string): RevisionCycle[] {
  const today = new Date().toISOString().split('T')[0];
  return listRevisions(studentId)
    .filter((r) => !r.done && r.dueDate <= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function markRevisionDone(studentId: string, chapterName: string, cycleNo: number) {
  const items = listRevisions(studentId).map((r) =>
    r.chapterName === chapterName && r.cycleNo === cycleNo ? { ...r, done: true, doneDate: new Date().toISOString().split('T')[0] } : r
  );
  saveRevisions(studentId, items);
  return items;
}

/** % of revision cycles that have come due so far that were actually reviewed. Null (not 0) until at least one cycle has come due — never punish a student for a queue that hasn't started yet. */
export function revisionAdherencePct(studentId: string): number | null {
  const today = new Date().toISOString().split('T')[0];
  const dueSoFar = listRevisions(studentId).filter((r) => r.dueDate <= today);
  if (dueSoFar.length === 0) return null;
  const done = dueSoFar.filter((r) => r.done).length;
  return Math.round((done / dueSoFar.length) * 100);
}

export interface ExamProgress {
  examTrack: ExamTrack;
  totalChapters: number;
  doneChapters: number;
  inProgressChapters: number;
  avgCompletionPct: number;
}

// A chapter counts toward every exam that actually examines its subject —
// Physics and Chemistry count toward all three, Maths toward KCET/JEE only,
// Biology toward KCET/NEET only (see SUBJECT_EXAM_TRACKS in lms.ts).
export function examProgressSummary(studentId: string): ExamProgress[] {
  const progress = listChapterProgress(studentId);
  return EXAM_TRACKS.map((examTrack) => {
    const relevant = progress.filter((c) => SUBJECT_EXAM_TRACKS[c.subject as Subject]?.includes(examTrack));
    const doneChapters = relevant.filter((c) => c.status === 'done').length;
    const inProgressChapters = relevant.filter((c) => c.status === 'in_progress').length;
    const avgCompletionPct = relevant.length > 0 ? Math.round(relevant.reduce((sum, c) => sum + c.completionPct, 0) / relevant.length) : 0;
    return { examTrack, totalChapters: relevant.length, doneChapters, inProgressChapters, avgCompletionPct };
  });
}
