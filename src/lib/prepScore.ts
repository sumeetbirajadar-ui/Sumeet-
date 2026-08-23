// Prep Score — a single 0-100 number combining syllabus progress, study
// hours, revision adherence, mock performance, habit consistency and
// wellbeing. A component the student hasn't engaged with yet is left out of
// the average entirely (never scored as 0) so the score reflects effort
// made, not features unused — the same never-punish principle as every
// other tracker in this app.

import { examProgressSummary, revisionAdherencePct } from './syllabusTracker';
import { minutesThisWeek } from './focus';
import { listHabits, weeklyCompletionPct } from './habits';
import { listResults, averagePct } from './mockTests';
import { recentMoodScore } from './wellbeing';

const WEEKLY_STUDY_MINUTES_TARGET = 20 * 60; // 20 hours/week, a reasonable full-time-prep benchmark

export interface PrepScoreComponent {
  key: string;
  label: string;
  weight: number;
  value: number | null;
}

export function prepScoreComponents(studentId: string): PrepScoreComponent[] {
  const syllabusPct = examProgressSummary(studentId)[0]?.avgCompletionPct ?? 0;
  const studyPct = Math.min(100, Math.round((minutesThisWeek(studentId) / WEEKLY_STUDY_MINUTES_TARGET) * 100));
  const revisionPct = revisionAdherencePct(studentId);
  const mockPct = listResults(studentId).length > 0 ? averagePct(studentId) : null;
  const habitPct = listHabits(studentId).length > 0 ? weeklyCompletionPct(studentId) : null;
  const wellbeingPct = recentMoodScore(studentId);

  return [
    { key: 'syllabus', label: 'Syllabus', weight: 30, value: syllabusPct },
    { key: 'study', label: 'Study Hours', weight: 20, value: studyPct },
    { key: 'revision', label: 'Revision Adherence', weight: 20, value: revisionPct },
    { key: 'mock', label: 'Mock Performance', weight: 15, value: mockPct },
    { key: 'habit', label: 'Habit Consistency', weight: 10, value: habitPct },
    { key: 'wellbeing', label: 'Wellbeing', weight: 5, value: wellbeingPct },
  ];
}

export function prepScore(studentId: string): number {
  const available = prepScoreComponents(studentId).filter((c): c is PrepScoreComponent & { value: number } => c.value !== null);
  const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = available.reduce((sum, c) => sum + c.value * c.weight, 0);
  return Math.round(weighted / totalWeight);
}
