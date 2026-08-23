import React, { useState } from 'react';
import { ClipboardList, AlertOctagon, Plus, Trash2, CheckCircle2, Circle, Target } from 'lucide-react';
import {
  MockExamType,
  MOCK_EXAM_TYPES,
  MARKING_SCHEMES,
  MockTestResult,
  listResults,
  addResult,
  deleteResult,
  pctOf,
  averagePct,
  bestPct,
  trendData,
  subjectAverages,
} from '../lib/mockTests';
import { MistakeType, MISTAKE_TYPES, ErrorLogEntry, listErrors, addError, updateError, deleteError, errorsByType, weakestChapters, unresolvedCount } from '../lib/errorLog';
import { getOrCreateStudentId } from '../lib/studentIdentity';

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white border-2 border-ink-100 rounded-3xl p-4 text-center">
      <p className={`text-2xl font-bold font-display ${accent}`}>{value}</p>
      <p className="text-xs text-ink-500 mt-0.5">{label}</p>
    </div>
  );
}

const BarRow: React.FC<{ label: string; value: number; max: number; suffix: string; colorClass: string }> = ({ label, value, max, suffix, colorClass }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-28 shrink-0 text-ink-600 truncate">{label}</span>
      <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="text-xs text-ink-400 w-14 text-right shrink-0">
        {value}
        {suffix}
      </span>
    </div>
  );
};

function MockTestsPanel() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  const [showForm, setShowForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [examType, setExamType] = useState<MockExamType>('NEET');
  const [testName, setTestName] = useState('');
  const [date, setDate] = useState(today());
  const [totalMarks, setTotalMarks] = useState(MARKING_SCHEMES.NEET.totalMarks);
  const [scoredMarks, setScoredMarks] = useState<number | ''>('');
  const [physicsMarks, setPhysicsMarks] = useState<number | ''>('');
  const [chemistryMarks, setChemistryMarks] = useState<number | ''>('');
  const [mathsMarks, setMathsMarks] = useState<number | ''>('');
  const [biologyMarks, setBiologyMarks] = useState<number | ''>('');
  const [correctCount, setCorrectCount] = useState<number | ''>('');
  const [incorrectCount, setIncorrectCount] = useState<number | ''>('');
  const [unattemptedCount, setUnattemptedCount] = useState<number | ''>('');
  const [timeTakenMin, setTimeTakenMin] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const results = listResults(studentId);
  const trend = trendData(studentId);
  const subjAvgs = subjectAverages(studentId);
  const scheme = MARKING_SCHEMES[examType];

  function handleExamTypeChange(v: MockExamType) {
    setExamType(v);
    setTotalMarks(MARKING_SCHEMES[v].totalMarks);
  }

  function resetForm() {
    setTestName('');
    setDate(today());
    setScoredMarks('');
    setPhysicsMarks('');
    setChemistryMarks('');
    setMathsMarks('');
    setBiologyMarks('');
    setCorrectCount('');
    setIncorrectCount('');
    setUnattemptedCount('');
    setTimeTakenMin('');
    setNotes('');
    setShowAdvanced(false);
    setShowForm(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!testName.trim() || scoredMarks === '') return;
    addResult(studentId, {
      examType,
      testName: testName.trim(),
      date,
      totalMarks,
      scoredMarks: Number(scoredMarks),
      physicsMarks: physicsMarks === '' ? null : Number(physicsMarks),
      chemistryMarks: chemistryMarks === '' ? null : Number(chemistryMarks),
      mathsMarks: mathsMarks === '' ? null : Number(mathsMarks),
      biologyMarks: biologyMarks === '' ? null : Number(biologyMarks),
      correctCount: correctCount === '' ? null : Number(correctCount),
      incorrectCount: incorrectCount === '' ? null : Number(incorrectCount),
      unattemptedCount: unattemptedCount === '' ? null : Number(unattemptedCount),
      timeTakenMin: timeTakenMin === '' ? null : Number(timeTakenMin),
      notes,
    });
    resetForm();
    forceUpdate();
  }

  const maxTrendPct = Math.max(...trend.map((t) => t.pct), 1);
  const maxSubjAvg = Math.max(...subjAvgs.map((s) => s.avgMarks), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Tests Taken" value={String(results.length)} accent="text-ink-900" />
        <StatCard label="Average" value={`${averagePct(studentId)}%`} accent="text-sage-600" />
        <StatCard label="Best" value={`${bestPct(studentId)}%`} accent="text-gold-600" />
      </div>

      {trend.length > 1 && (
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500 mb-3">Score Trend</h3>
          <div className="space-y-2">
            {trend.map((t, i) => (
              <BarRow key={`${t.date}-${i}`} label={t.testName} value={t.pct} max={maxTrendPct} suffix="%" colorClass="bg-gold-400" />
            ))}
          </div>
        </div>
      )}

      {subjAvgs.length > 0 && (
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500 mb-3">Subject Averages</h3>
          <div className="space-y-2">
            {subjAvgs.map((s) => (
              <BarRow key={s.subject} label={s.subject} value={s.avgMarks} max={maxSubjAvg} suffix=" marks" colorClass="bg-sage-400" />
            ))}
          </div>
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ink-200 rounded-3xl py-4 text-ink-500 font-semibold hover:border-gold-300"
        >
          <Plus className="w-4 h-4" /> Log a Mock Test
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-ink-100 rounded-3xl p-5 space-y-3">
          <h3 className="font-bold text-ink-800">New Mock Test</h3>
          <div className="grid grid-cols-2 gap-2">
            <select value={examType} onChange={(e) => handleExamTypeChange(e.target.value as MockExamType)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm bg-white">
              {MOCK_EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          </div>
          <p className="text-xs text-ink-400">{scheme.note}</p>
          <input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Test name (e.g. Weekly Mock Test #4)" className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              placeholder="Total marks"
              className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              value={scoredMarks}
              onChange={(e) => setScoredMarks(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Your score"
              className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
              required
            />
          </div>

          {!showAdvanced ? (
            <button type="button" onClick={() => setShowAdvanced(true)} className="text-xs font-bold text-sage-600 underline">
              + Add subject-wise marks &amp; accuracy details
            </button>
          ) : (
            <div className="space-y-2 border-t border-ink-100 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={physicsMarks} onChange={(e) => setPhysicsMarks(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Physics marks" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
                <input type="number" value={chemistryMarks} onChange={(e) => setChemistryMarks(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Chemistry marks" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
                <input type="number" value={mathsMarks} onChange={(e) => setMathsMarks(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Maths marks" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
                <input type="number" value={biologyMarks} onChange={(e) => setBiologyMarks(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Biology marks" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={correctCount} onChange={(e) => setCorrectCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Correct" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
                <input type="number" value={incorrectCount} onChange={(e) => setIncorrectCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Incorrect" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
                <input type="number" value={unattemptedCount} onChange={(e) => setUnattemptedCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Unattempted" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
              </div>
              <input type="number" value={timeTakenMin} onChange={(e) => setTimeTakenMin(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Time taken (minutes)" className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl">
              Save Result
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-2xl text-ink-500 hover:bg-ink-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {results.map((r: MockTestResult) => (
          <div key={r.id} className="bg-white border-2 border-ink-100 rounded-3xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">{r.examType}</span>
                <p className="font-semibold text-ink-900 text-sm truncate">{r.testName}</p>
              </div>
              <p className="text-xs text-ink-400 mt-1">
                {r.date} &middot; {r.scoredMarks}/{r.totalMarks} ({pctOf(r)}%)
              </p>
            </div>
            <button onClick={() => { deleteResult(studentId, r.id); forceUpdate(); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorLogPanel() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('Physics');
  const [chapterName, setChapterName] = useState('');
  const [questionSummary, setQuestionSummary] = useState('');
  const [mistakeType, setMistakeType] = useState<MistakeType>('conceptual');
  const [correctApproach, setCorrectApproach] = useState('');

  const errors = listErrors(studentId);
  const filtered = errors.filter((e) => (filter === 'all' ? true : filter === 'unresolved' ? !e.resolved : e.resolved));
  const byType = errorsByType(studentId);
  const weakChapters = weakestChapters(studentId);
  const maxTypeCount = Math.max(...byType.map((b) => b.count), 1);
  const maxChapterCount = Math.max(...weakChapters.map((b) => b.count), 1);

  function resetForm() {
    setChapterName('');
    setQuestionSummary('');
    setCorrectApproach('');
    setShowForm(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!questionSummary.trim()) return;
    addError(studentId, {
      subject,
      chapterName: chapterName.trim(),
      questionSummary: questionSummary.trim(),
      mistakeType,
      correctApproach: correctApproach.trim(),
      resolved: false,
      date: today(),
    });
    resetForm();
    forceUpdate();
  }

  function toggleResolved(entry: ErrorLogEntry) {
    updateError(studentId, entry.id, { resolved: !entry.resolved });
    forceUpdate();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Unresolved Mistakes" value={String(unresolvedCount(studentId))} accent="text-clay-500" />
        <StatCard label="Weakest Chapter" value={weakChapters[0]?.label || '—'} accent="text-ink-900" />
      </div>

      {byType.length > 0 && (
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500 mb-3">Mistake Patterns</h3>
          <div className="space-y-2">
            {byType.map((b) => (
              <BarRow key={b.label} label={b.label} value={b.count} max={maxTypeCount} suffix="" colorClass="bg-clay-400" />
            ))}
          </div>
        </div>
      )}

      {weakChapters.length > 0 && (
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500 mb-3">Chapters to Revisit</h3>
          <div className="space-y-2">
            {weakChapters.map((b) => (
              <BarRow key={b.label} label={b.label} value={b.count} max={maxChapterCount} suffix="" colorClass="bg-gold-400" />
            ))}
          </div>
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ink-200 rounded-3xl py-4 text-ink-500 font-semibold hover:border-gold-300"
        >
          <Plus className="w-4 h-4" /> Log a Mistake
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-ink-100 rounded-3xl p-5 space-y-3">
          <h3 className="font-bold text-ink-800">New Error Log Entry</h3>
          <div className="grid grid-cols-2 gap-2">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm bg-white">
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Maths">Maths</option>
              <option value="Biology">Biology</option>
            </select>
            <input value={chapterName} onChange={(e) => setChapterName(e.target.value)} placeholder="Chapter" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          </div>
          <textarea value={questionSummary} onChange={(e) => setQuestionSummary(e.target.value)} placeholder="What was the question about?" rows={2} className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" required />
          <select value={mistakeType} onChange={(e) => setMistakeType(e.target.value as MistakeType)} className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm bg-white">
            {MISTAKE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <textarea value={correctApproach} onChange={(e) => setCorrectApproach(e.target.value)} placeholder="What's the correct approach next time?" rows={2} className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl">
              Save Entry
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-2xl text-ink-500 hover:bg-ink-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2 justify-center">
        {(['unresolved', 'resolved', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${filter === f ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((entry) => (
          <div key={entry.id} className="bg-white border-2 border-ink-100 rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => toggleResolved(entry)} className="flex items-start gap-3 flex-1 text-left">
                {entry.resolved ? <CheckCircle2 className="w-5 h-5 text-sage-500 shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-ink-300 shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">{entry.subject}</span>
                    {entry.chapterName && <span className="text-xs text-ink-500">{entry.chapterName}</span>}
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-clay-50 text-clay-600 px-2 py-0.5 rounded-full">
                      {MISTAKE_TYPES.find((t) => t.value === entry.mistakeType)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-ink-800 mt-1">{entry.questionSummary}</p>
                  {entry.correctApproach && <p className="text-xs text-sage-600 mt-1">Fix: {entry.correctApproach}</p>}
                </div>
              </button>
              <button onClick={() => { deleteError(studentId, entry.id); forceUpdate(); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-ink-400 py-6">Nothing here yet.</p>}
      </div>
    </div>
  );
}

export default function Performance() {
  const [tab, setTab] = useState<'mocks' | 'errors'>('mocks');
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2 flex items-center justify-center gap-2">
          <Target className="w-7 h-7 text-gold-500" /> Performance
        </h1>
        <p className="text-ink-500 text-sm">Track your mock tests and turn mistakes into a study plan.</p>
      </header>
      <div className="flex gap-2 mb-6 justify-center">
        <button onClick={() => setTab('mocks')} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${tab === 'mocks' ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}>
          <ClipboardList className="w-4 h-4" /> Mock Tests
        </button>
        <button onClick={() => setTab('errors')} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${tab === 'errors' ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}>
          <AlertOctagon className="w-4 h-4" /> Error Log
        </button>
      </div>
      {tab === 'mocks' ? <MockTestsPanel /> : <ErrorLogPanel />}
    </div>
  );
}
