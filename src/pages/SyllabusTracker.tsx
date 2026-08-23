import React, { useMemo, useState } from 'react';
import { ChevronDown, Star, CheckCircle2, Circle, CircleDot, BookOpenCheck, CalendarClock } from 'lucide-react';
import {
  ChapterProgress,
  ChapterStatus,
  listChapterProgress,
  updateChapterProgress,
  examProgressSummary,
  getDueRevisions,
  markRevisionDone,
} from '../lib/syllabusTracker';
import { getOrCreateStudentId } from '../lib/studentIdentity';

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}

const STATUS_META: Record<ChapterStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  not_started: { label: 'Not Started', badge: 'bg-white border-2 border-ink-300 text-ink-500', icon: <Circle className="w-3.5 h-3.5" /> },
  in_progress: { label: 'In Progress', badge: 'bg-gold-400 text-ink-900', icon: <CircleDot className="w-3.5 h-3.5" /> },
  done: { label: 'Done', badge: 'bg-sage-500 text-white', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

function StatusPill({ status }: { status: ChapterStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${meta.badge}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

const ExamRing: React.FC<{ label: string; pct: number }> = ({ label, pct }) => {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center bg-white border-2 border-ink-100 rounded-3xl p-4 flex-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-ink-100)" strokeWidth="8" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="var(--color-gold-400)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-ink-900 font-display text-lg">{pct}%</div>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mt-2">{label}</p>
    </div>
  );
};

const ChapterRow: React.FC<{ chapter: ChapterProgress; studentId: string; onChange: () => void }> = ({ chapter, studentId, onChange }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    completionPct: chapter.completionPct,
    questionsPracticed: chapter.questionsPracticed,
    targetDate: chapter.targetDate,
    notes: chapter.notes,
  });

  // Keep the local edit buffer in sync when the underlying record changes
  // for reasons other than typing in these fields (e.g. setStatus below
  // setting completionPct to 100, or a re-seed merging in new fields).
  React.useEffect(() => {
    setDraft({
      completionPct: chapter.completionPct,
      questionsPracticed: chapter.questionsPracticed,
      targetDate: chapter.targetDate,
      notes: chapter.notes,
    });
  }, [chapter]);

  function setStatus(status: ChapterStatus) {
    updateChapterProgress(studentId, chapter.chapterName, { status, completionPct: status === 'done' ? 100 : chapter.completionPct });
    onChange();
  }

  function setConfidence(stars: number) {
    updateChapterProgress(studentId, chapter.chapterName, { confidence: chapter.confidence === stars ? 0 : stars });
    onChange();
  }

  function commit(field: 'completionPct' | 'questionsPracticed' | 'targetDate' | 'notes') {
    updateChapterProgress(studentId, chapter.chapterName, { [field]: draft[field] } as any);
    onChange();
  }

  return (
    <div className="bg-white border-2 border-ink-100 rounded-3xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-900 text-sm truncate">
            {chapter.chapterIndex}. {chapter.chapterName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <StatusPill status={chapter.status} />
            {chapter.confidence > 0 && (
              <span className="flex items-center gap-0.5 text-gold-500">
                {Array.from({ length: chapter.confidence }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-gold-400" />
                ))}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-ink-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-ink-100 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['not_started', 'in_progress', 'done'] as ChapterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                  chapter.status === s ? STATUS_META[s].badge : 'bg-ink-50 text-ink-500'
                }`}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">Completion — {draft.completionPct}%</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={draft.completionPct}
              onChange={(e) => setDraft((d) => ({ ...d, completionPct: Number(e.target.value) }))}
              onMouseUp={() => commit('completionPct')}
              onTouchEnd={() => commit('completionPct')}
              className="w-full accent-gold-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">Confidence</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setConfidence(s)}>
                  <Star className={`w-6 h-6 ${s <= chapter.confidence ? 'fill-gold-400 text-gold-400' : 'text-ink-200'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">Questions Practised</label>
              <input
                type="number"
                min={0}
                value={draft.questionsPracticed}
                onChange={(e) => setDraft((d) => ({ ...d, questionsPracticed: Number(e.target.value) }))}
                onBlur={() => commit('questionsPracticed')}
                className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">Target Date</label>
              <input
                type="date"
                value={draft.targetDate}
                onChange={(e) => setDraft((d) => ({ ...d, targetDate: e.target.value }))}
                onBlur={() => commit('targetDate')}
                className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              onBlur={() => commit('notes')}
              rows={2}
              className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-ink-400">Counts toward:</span>
            {['KCET', 'NEET', 'JEE'].map((t) => (
              <span key={t} className="text-xs font-bold px-2 py-0.5 rounded-full bg-ink-100 text-ink-600">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

type Filter = 'all' | ChapterStatus;

export default function SyllabusTracker() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  const [filter, setFilter] = useState<Filter>('all');
  const chapters = listChapterProgress(studentId);
  const examSummaries = examProgressSummary(studentId);
  const dueRevisions = getDueRevisions(studentId);

  const filtered = useMemo(() => (filter === 'all' ? chapters : chapters.filter((c) => c.status === filter)), [chapters, filter]);

  function handleReview(chapterName: string, cycleNo: number) {
    markRevisionDone(studentId, chapterName, cycleNo);
    forceUpdate();
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2 flex items-center justify-center gap-2">
          <BookOpenCheck className="w-7 h-7 text-gold-500" /> Syllabus Tracker
        </h1>
        <p className="text-ink-500 text-sm max-w-md mx-auto">
          Track each Physics chapter once — since KCET, NEET and JEE all draw on the same syllabus, your progress updates all three at once.
        </p>
      </header>

      <div className="flex gap-3 mb-6">
        {examSummaries.map((e) => (
          <ExamRing key={e.examTrack} label={e.examTrack} pct={e.avgCompletionPct} />
        ))}
      </div>

      {dueRevisions.length > 0 && (
        <div className="bg-gold-50 border-2 border-gold-200 rounded-3xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-gold-600" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-gold-700">Due for Revision Today</h2>
          </div>
          <div className="space-y-2">
            {dueRevisions.map((r) => (
              <div key={`${r.chapterName}-${r.cycleNo}`} className="flex items-center justify-between bg-white rounded-2xl px-4 py-2.5">
                <span className="text-sm font-medium text-ink-800">{r.chapterName}</span>
                <button
                  onClick={() => handleReview(r.chapterName, r.cycleNo)}
                  className="text-xs font-bold bg-gold-400 hover:bg-gold-300 text-ink-900 px-3 py-1.5 rounded-full"
                >
                  Mark Reviewed
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap justify-center">
        {(['all', 'not_started', 'in_progress', 'done'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              filter === f ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_META[f].label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((c) => (
          <ChapterRow key={c.chapterName} chapter={c} studentId={studentId} onChange={forceUpdate} />
        ))}
      </div>
    </div>
  );
}
