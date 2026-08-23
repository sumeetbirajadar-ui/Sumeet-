import React, { useMemo, useState } from 'react';
import { Video, FileText, BookOpenCheck, MessageCircle, Send, CheckCircle2, ExternalLink } from 'lucide-react';
import {
  Batch,
  listBatches,
  visibleClassesForBatch,
  visibleContentForBatch,
  listPyq,
  recordAttendance,
  attendanceForClass,
  listThreadsForStudent,
  listMessages,
  createThread,
  postMessage,
} from '../lib/lms';
import { getOrCreateStudentId, getStudentName, getStudentBatchId, setStudentBatchId } from '../lib/studentIdentity';

type Tab = 'classes' | 'content' | 'pyq' | 'doubts';

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}

function BatchPicker({ batches, batchId, onChange }: { batches: Batch[]; batchId: string | null; onChange: (id: string | null) => void }) {
  if (batches.length === 0) return null;
  return (
    <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 mb-6 flex items-center gap-3 flex-wrap">
      <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Your Batch</span>
      <select
        value={batchId || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="border-2 border-stone-200 rounded-xl px-3 py-1.5 text-sm bg-white"
      >
        <option value="">Not set — showing content for all batches only</option>
        {batches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name} ({b.examTrack} {b.year})
          </option>
        ))}
      </select>
    </div>
  );
}

function ClassesPanel({ batchId }: { batchId: string | null }) {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  const studentName = getStudentName();
  const classes = useMemo(() => visibleClassesForBatch(batchId), [batchId]);

  function handleJoin(classId: string, url: string) {
    recordAttendance(classId, studentId, studentName);
    forceUpdate();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (classes.length === 0) {
    return <p className="text-stone-400 italic text-sm">No live classes scheduled yet.</p>;
  }

  return (
    <div className="space-y-3">
      {classes.map((c) => {
        const attended = attendanceForClass(c.id).some((a) => a.studentId === studentId);
        return (
          <div key={c.id} className="bg-white border-2 border-stone-200 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  c.publishState === 'ended' ? 'bg-stone-100 text-stone-500' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {c.publishState}
                </span>
                <h4 className="font-bold text-stone-800">{c.title}</h4>
              </div>
              <p className="text-xs text-stone-500">
                {c.subject} · {c.chapter} · {new Date(c.scheduledStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            <button
              onClick={() => handleJoin(c.id, c.joinUrl)}
              className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm shrink-0"
            >
              {attended && <CheckCircle2 className="w-4 h-4" />}
              Join <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ContentPanel({ batchId }: { batchId: string | null }) {
  const items = useMemo(() => visibleContentForBatch(batchId), [batchId]);
  if (items.length === 0) return <p className="text-stone-400 italic text-sm">No notes or videos published yet.</p>;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white border-2 border-stone-200 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-300 transition-all"
        >
          <div className="p-2 bg-stone-50 rounded-xl text-amber-500 shrink-0">
            {item.kind === 'note' ? <FileText className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-stone-800 truncate">{item.title}</h4>
            <p className="text-xs text-stone-500">{item.subject} · {item.chapter}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

function PyqPanel() {
  const questions = listPyq();
  const [examFilter, setExamFilter] = useState('');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const exams = useMemo(() => Array.from(new Set(questions.map((q) => q.exam))).sort(), [questions]);
  const filtered = examFilter ? questions.filter((q) => q.exam === examFilter) : questions;

  if (questions.length === 0) return <p className="text-stone-400 italic text-sm">No PYQ questions added yet.</p>;

  return (
    <div className="space-y-4">
      <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)} className="border-2 border-stone-200 rounded-xl px-3 py-2 bg-white text-sm">
        <option value="">All exams</option>
        {exams.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
      {filtered.map((q, idx) => (
        <div key={q.id} className="bg-white border-2 border-stone-200 rounded-2xl p-5">
          <p className="text-xs text-stone-400 mb-2">
            {q.exam} {q.year} · {q.subject} · {q.chapter}
          </p>
          <p className="font-semibold text-stone-800 mb-3">
            {idx + 1}. {q.question}
          </p>
          <div className="space-y-1.5 mb-3">
            {q.options.map((opt, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-1.5 rounded-lg border ${
                  revealed[q.id] && i === q.answerIndex ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'border-stone-200 text-stone-600'
                }`}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </div>
            ))}
          </div>
          <button
            onClick={() => setRevealed((r) => ({ ...r, [q.id]: !r[q.id] }))}
            className="text-xs font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700"
          >
            {revealed[q.id] ? 'Hide Answer' : 'Show Answer'}
          </button>
        </div>
      ))}
    </div>
  );
}

function DoubtsPanel() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  const studentName = getStudentName();
  const threads = listThreadsForStudent(studentId);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState<Record<string, string>>({});

  function handleNewThread(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    createThread(studentId, studentName, subject.trim(), message.trim());
    setSubject('');
    setMessage('');
    forceUpdate();
  }

  function handleReply(threadId: string) {
    const body = (reply[threadId] || '').trim();
    if (!body) return;
    postMessage(threadId, 'student', body);
    setReply((r) => ({ ...r, [threadId]: '' }));
    forceUpdate();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleNewThread} className="bg-white border-2 border-stone-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-stone-800">Ask a Doubt</h3>
        <p className="text-xs text-stone-400">Only you and the admin/teacher can see this thread.</p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject / Chapter"
          className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 text-sm"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your doubt..."
          rows={2}
          className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
          <Send className="w-4 h-4" /> Send
        </button>
      </form>

      {threads.length === 0 && <p className="text-stone-400 italic text-sm">No doubts asked yet.</p>}
      {threads.map((t) => {
        const messages = listMessages(t.id);
        return (
          <div key={t.id} className="bg-white border-2 border-stone-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {t.status}
              </span>
              <h4 className="font-bold text-stone-800">{t.subject}</h4>
            </div>
            <div className="space-y-2 mb-3">
              {messages.map((m) => (
                <div key={m.id} className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${m.senderRole === 'admin' ? 'bg-blue-50 text-blue-900 ml-auto text-right' : 'bg-stone-50 text-stone-700'}`}>
                  <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">{m.senderRole === 'admin' ? 'Teacher' : 'You'}</p>
                  {m.body}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={reply[t.id] || ''}
                onChange={(e) => setReply((r) => ({ ...r, [t.id]: e.target.value }))}
                placeholder="Reply..."
                className="flex-1 border-2 border-stone-200 rounded-xl px-3 py-1.5 text-sm"
              />
              <button onClick={() => handleReply(t.id)} className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200">
                <Send className="w-4 h-4 text-stone-600" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StudentLMS() {
  const [tab, setTab] = useState<Tab>('classes');
  const [batchId, setBatchId] = useState<string | null>(() => getStudentBatchId());
  const batches = listBatches();

  function handleBatchChange(id: string | null) {
    setStudentBatchId(id);
    setBatchId(id);
  }

  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: 'classes', label: 'Live Classes', icon: <Video className="w-4 h-4" /> },
    { key: 'content', label: 'Notes & Videos', icon: <FileText className="w-4 h-4" /> },
    { key: 'pyq', label: 'PYQ Bank', icon: <BookOpenCheck className="w-4 h-4" /> },
    { key: 'doubts', label: 'My Doubts', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight uppercase font-display mb-2">Learning Hub</h1>
        <p className="text-stone-500 text-sm">Live classes, notes, PYQs and doubts — all in one place.</p>
      </header>

      <BatchPicker batches={batches} batchId={batchId} onChange={handleBatchChange} />

      <div className="flex gap-2 mb-6 flex-wrap justify-center">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              tab === t.key ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'classes' && <ClassesPanel batchId={batchId} />}
      {tab === 'content' && <ContentPanel batchId={batchId} />}
      {tab === 'pyq' && <PyqPanel />}
      {tab === 'doubts' && <DoubtsPanel />}
    </div>
  );
}
