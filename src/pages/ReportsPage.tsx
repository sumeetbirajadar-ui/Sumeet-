import React, { useState } from 'react';
import { FileBarChart, Printer } from 'lucide-react';
import { getOrCreateStudentId, getStudentName } from '../lib/studentIdentity';
import { examProgressSummary, getDueRevisions } from '../lib/syllabusTracker';
import { listSessions } from '../lib/focus';
import { listResults, pctOf } from '../lib/mockTests';
import { listHabits, weeklyCompletionPct } from '../lib/habits';
import { listEntries } from '../lib/wellbeing';
import { prepScore, prepScoreComponents } from '../lib/prepScore';
import { currentWeekRange, currentMonthRange } from '../lib/targets';

type Period = 'week' | 'month';

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('week');
  const studentId = getOrCreateStudentId();
  const studentName = getStudentName();
  const range = period === 'week' ? currentWeekRange() : currentMonthRange();

  const examSummary = examProgressSummary(studentId)[0];
  const sessions = listSessions(studentId).filter((s) => s.logDate >= range.start && s.logDate <= range.end);
  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const mocks = listResults(studentId).filter((r) => r.date >= range.start && r.date <= range.end);
  const habitPct = listHabits(studentId).length > 0 ? weeklyCompletionPct(studentId) : null;
  const journalEntries = listEntries(studentId).filter((e) => e.date >= range.start && e.date <= range.end);
  const avgMood = journalEntries.length > 0 ? (journalEntries.reduce((s, e) => s + e.mood, 0) / journalEntries.length).toFixed(1) : null;
  const score = prepScore(studentId);
  const components = prepScoreComponents(studentId);
  const dueRevisions = getDueRevisions(studentId);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-print, .report-print * { visibility: visible; }
          .report-print { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <header className="text-center mb-6 no-print">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2 flex items-center justify-center gap-2">
          <FileBarChart className="w-7 h-7 text-gold-500" /> Reports
        </h1>
        <p className="text-ink-500 text-sm">A shareable summary of the week or month — print or save as PDF.</p>
      </header>

      <div className="flex gap-2 mb-6 justify-center no-print">
        {(['week', 'month'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${period === p ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
          >
            This {p}
          </button>
        ))}
      </div>

      <div className="report-print space-y-4">
        <div className="text-center mb-2">
          <img src="/branding/science-monk-logo.png" alt="Science Monk Academy" className="w-12 h-12 rounded-full object-cover mx-auto mb-2" />
          <h2 className="text-2xl font-bold font-display">
            {studentName}'s {period === 'week' ? 'Weekly' : 'Monthly'} Report
          </h2>
          <p className="text-sm text-ink-500">
            {range.start} to {range.end}
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-ink-400 text-[10px]">
            <img src="/branding/founder-photo.png" alt="Founder, Science Monk" className="w-5 h-5 rounded-full object-cover" />
            <span>A Science Monk creation</span>
          </div>
        </div>

        <div className="bg-white border-2 border-ink-100 rounded-3xl p-5 text-center">
          <p className="text-4xl font-bold font-display text-gold-600">{score}</p>
          <p className="text-xs uppercase tracking-wider text-ink-500 mt-1">Prep Score</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border-2 border-ink-100 rounded-2xl p-4 text-center">
            <p className="text-xl font-bold">{examSummary?.avgCompletionPct ?? 0}%</p>
            <p className="text-xs text-ink-500">Syllabus Complete</p>
          </div>
          <div className="bg-white border-2 border-ink-100 rounded-2xl p-4 text-center">
            <p className="text-xl font-bold">{Math.round((totalMinutes / 60) * 10) / 10}h</p>
            <p className="text-xs text-ink-500">Study Time</p>
          </div>
          <div className="bg-white border-2 border-ink-100 rounded-2xl p-4 text-center">
            <p className="text-xl font-bold">{mocks.length}</p>
            <p className="text-xs text-ink-500">Mock Tests Taken</p>
          </div>
          <div className="bg-white border-2 border-ink-100 rounded-2xl p-4 text-center">
            <p className="text-xl font-bold">{habitPct === null ? '—' : `${habitPct}%`}</p>
            <p className="text-xs text-ink-500">Habit Consistency</p>
          </div>
        </div>

        {mocks.length > 0 && (
          <div className="bg-white border-2 border-ink-100 rounded-2xl p-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500 mb-2">Mock Tests</h3>
            <div className="space-y-1">
              {mocks.map((m) => (
                <p key={m.id} className="text-sm text-ink-700">
                  {m.date} — {m.examType} {m.testName}: {m.scoredMarks}/{m.totalMarks} ({pctOf(m)}%)
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border-2 border-ink-100 rounded-2xl p-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500 mb-2">Score Breakdown</h3>
          <div className="space-y-1">
            {components.map((c) => (
              <p key={c.key} className="text-sm text-ink-700 flex justify-between">
                <span>{c.label}</span>
                <span>{c.value === null ? 'No data yet' : `${c.value}%`}</span>
              </p>
            ))}
          </div>
        </div>

        {avgMood && <p className="text-sm text-ink-600 text-center">Average mood this {period}: {avgMood} / 5</p>}
        {dueRevisions.length > 0 && <p className="text-sm text-clay-600 text-center">{dueRevisions.length} revision(s) currently due</p>}
      </div>

      <button onClick={() => window.print()} className="no-print w-full mt-6 bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
        <Printer className="w-4 h-4" /> Print / Save as PDF
      </button>
    </div>
  );
}
