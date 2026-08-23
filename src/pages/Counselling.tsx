import React, { useEffect, useState } from 'react';
import { ClipboardCheck, CalendarClock, ListChecks, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { EXAM_TRACKS, ExamTrack } from '../lib/lms';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENTS_BY_CATEGORY,
  DocumentCategory,
  getDocumentChecklist,
  toggleDocument,
  TimelineEvent,
  subscribeTimelineEvents,
  daysUntil,
  listAllotments,
  addAllotment,
  deleteAllotment,
} from '../lib/counselling';
import { getOrCreateStudentId } from '../lib/studentIdentity';

type Tab = 'documents' | 'timeline' | 'allotments';

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}

function DocumentsPanel({ studentId }: { studentId: string }) {
  const forceUpdate = useForceUpdate();
  const [category, setCategory] = useState<DocumentCategory>('kcetApplication');
  const checklist = getDocumentChecklist(studentId, category);
  const docs = DOCUMENTS_BY_CATEGORY[category];
  const doneCount = docs.filter((d) => checklist[d]).length;
  const activeMeta = DOCUMENT_CATEGORIES.find((c) => c.key === category)!;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap justify-center">
        {DOCUMENT_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              category === c.key ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-ink-500 text-center">
        <strong className="text-ink-800">{doneCount}</strong> of {docs.length} ready
        <span className="block text-xs text-ink-400 mt-0.5">{activeMeta.hint}</span>
      </p>
      {docs.map((doc) => (
        <button
          key={doc}
          onClick={() => {
            toggleDocument(studentId, category, doc);
            forceUpdate();
          }}
          className="w-full flex items-center gap-3 bg-white border-2 border-ink-200 rounded-3xl px-4 py-3 text-left hover:border-gold-300 transition-all"
        >
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              checklist[doc] ? 'bg-gold-400 border-gold-400' : 'border-ink-300'
            }`}
          >
            {checklist[doc] && <ClipboardCheck className="w-3.5 h-3.5 text-ink-900" />}
          </div>
          <span className={`text-sm ${checklist[doc] ? 'text-ink-400 line-through' : 'text-ink-800 font-medium'}`}>{doc}</span>
        </button>
      ))}
    </div>
  );
}

function TimelinePanel() {
  const [track, setTrack] = useState<ExamTrack>('KCET');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  useEffect(() => subscribeTimelineEvents(setEvents, track), [track]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center">
        {EXAM_TRACKS.map((t) => (
          <button
            key={t}
            onClick={() => setTrack(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${track === t ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {events.length === 0 && <p className="text-ink-400 italic text-sm text-center">No counselling dates published yet for {track}.</p>}
      <div className="space-y-3">
        {events.map((e) => {
          const days = daysUntil(e.date);
          const urgent = days >= 0 && days <= 3;
          const past = days < 0;
          return (
            <div
              key={e.id}
              className={`bg-white border-2 rounded-3xl p-4 flex items-center justify-between gap-4 ${urgent ? 'border-rose-300' : 'border-ink-200'}`}
            >
              <div>
                <h4 className="font-bold text-ink-800">{e.title}</h4>
                <p className="text-xs text-ink-500">
                  {new Date(e.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  {e.note ? ` · ${e.note}` : ''}
                </p>
              </div>
              {!past && (
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                    urgent ? 'bg-rose-100 text-rose-700' : 'bg-sage-100 text-sage-800'
                  }`}
                >
                  {urgent && <AlertTriangle className="w-3.5 h-3.5" />}
                  {days === 0 ? 'Today' : `${days}d left`}
                </span>
              )}
              {past && <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-ink-100 text-ink-400 shrink-0">Past</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AllotmentsPanel({ studentId }: { studentId: string }) {
  const forceUpdate = useForceUpdate();
  const [examTrack, setExamTrack] = useState<ExamTrack>('KCET');
  const [round, setRound] = useState('Round 1');
  const [rank, setRank] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [category, setCategory] = useState('');
  const records = listAllotments(studentId);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!college.trim()) return;
    addAllotment(studentId, { examTrack, round, rank: rank.trim(), college: college.trim(), branch: branch.trim(), category: category.trim() });
    setCollege('');
    setBranch('');
    setCategory('');
    forceUpdate();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-white border-2 border-ink-200 rounded-3xl p-5 space-y-3">
        <h3 className="font-bold text-ink-800">Log an Allotment Result</h3>
        <p className="text-xs text-ink-400">Keep your own record of what you were allotted each round.</p>
        <div className="grid grid-cols-2 gap-2">
          <select value={examTrack} onChange={(e) => setExamTrack(e.target.value as ExamTrack)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm bg-white">
            {EXAM_TRACKS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={round} onChange={(e) => setRound(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm bg-white">
            {['Mock', 'Round 1', 'Round 2', 'Mop-up'].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input value={rank} onChange={(e) => setRank(e.target.value)} placeholder="Your rank" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
        </div>
        <input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="College allotted" className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
        <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Branch / Course" className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
        <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-4 py-2 rounded-2xl text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Save
        </button>
      </form>

      {records.length === 0 && <p className="text-ink-400 italic text-sm text-center">No allotment results logged yet.</p>}
      <div className="space-y-3">
        {records.map((r) => (
          <div key={r.id} className="bg-white border-2 border-ink-200 rounded-3xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-ink-100 text-ink-600">
                  {r.examTrack} · {r.round}
                </span>
              </div>
              <h4 className="font-bold text-ink-800">{r.college}</h4>
              <p className="text-xs text-ink-500">
                {r.branch} {r.category ? `· ${r.category}` : ''} {r.rank ? `· Rank ${r.rank}` : ''}
              </p>
            </div>
            <button onClick={() => { deleteAllotment(studentId, r.id); forceUpdate(); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Counselling() {
  const [tab, setTab] = useState<Tab>('documents');
  const studentId = getOrCreateStudentId();

  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: 'documents', label: 'Documents', icon: <ListChecks className="w-4 h-4" /> },
    { key: 'timeline', label: 'Timeline', icon: <CalendarClock className="w-4 h-4" /> },
    { key: 'allotments', label: 'My Allotments', icon: <ClipboardCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2">Counselling Companion</h1>
        <p className="text-ink-500 text-sm">Documents, dates, and your seat-allotment history — for KCET, NEET and JEE counselling.</p>
      </header>

      <div className="flex gap-2 mb-6 flex-wrap justify-center">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              tab === t.key ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'documents' && <DocumentsPanel studentId={studentId} />}
      {tab === 'timeline' && <TimelinePanel />}
      {tab === 'allotments' && <AllotmentsPanel studentId={studentId} />}
    </div>
  );
}
