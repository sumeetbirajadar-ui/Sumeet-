import React, { useEffect, useMemo, useState } from 'react';
import { Video, FileText, BookOpenCheck, MessageCircle, Send, CheckCircle2, ExternalLink, ChevronDown, Lightbulb, Library, Plus, Trash2 } from 'lucide-react';
import {
  Batch,
  subscribeBatches,
  LiveClass,
  ContentItem,
  subscribeClasses,
  subscribeContent,
  visibleClassesForBatch,
  visibleContentForBatch,
  recordAttendance,
  AttendanceRecord,
  subscribeAllAttendance,
  DoubtThread,
  DoubtMessage,
  subscribeThreadsForStudent,
  subscribeMessages,
  createThread,
  postMessage,
  ExamTrack,
  Subject,
  SUBJECTS,
  SUBJECT_EXAM_TRACKS,
  ChapterResource,
  subscribeChapterResources,
} from '../lib/lms';
import { getOrCreateStudentId, getStudentName, getStudentBatchId, setStudentBatchId } from '../lib/studentIdentity';
import YouTubeCard from '../components/YouTubeCard';
import { ResourceStatus, BookRef, listAllBooks, addCustomBook, deleteCustomBook, getProgress, updateProgress, progressSummary } from '../lib/resources';

type Tab = 'classes' | 'content' | 'pyq' | 'doubts' | 'resources';

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}

function BatchPicker({ batches, batchId, onChange }: { batches: Batch[]; batchId: string | null; onChange: (id: string | null) => void }) {
  if (batches.length === 0) return null;
  return (
    <div className="bg-white border-2 border-ink-200 rounded-3xl p-4 mb-6 flex items-center gap-3 flex-wrap">
      <span className="text-xs font-bold uppercase tracking-widest text-ink-500">Your Batch</span>
      <select
        value={batchId || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="border-2 border-ink-200 rounded-2xl px-3 py-1.5 text-sm bg-white"
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
  const studentId = getOrCreateStudentId();
  const studentName = getStudentName();
  const [allClasses, setAllClasses] = useState<LiveClass[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  useEffect(() => subscribeClasses(setAllClasses), []);
  useEffect(() => subscribeAllAttendance(setAttendance), []);
  const classes = useMemo(() => visibleClassesForBatch(allClasses, batchId), [allClasses, batchId]);

  function handleJoin(classId: string, url: string) {
    recordAttendance(classId, studentId, studentName);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (classes.length === 0) {
    return <p className="text-ink-400 italic text-sm">No live classes scheduled yet.</p>;
  }

  return (
    <div className="space-y-3">
      {classes.map((c) => {
        const attended = attendance.some((a) => a.classId === c.id && a.studentId === studentId);
        return (
          <div key={c.id} className="bg-white border-2 border-ink-200 rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                c.publishState === 'ended' ? 'bg-ink-100 text-ink-500' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {c.publishState}
              </span>
              <span className="text-xs text-ink-500">
                {c.subject} · {c.chapter} · {new Date(c.scheduledStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <YouTubeCard
              url={c.joinUrl}
              title={c.title}
              subtitle="Tap to join the live class"
              onClick={() => handleJoin(c.id, c.joinUrl)}
              badge={attended ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}

function ContentPanel({ batchId }: { batchId: string | null }) {
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  useEffect(() => subscribeContent(setAllContent), []);
  const items = useMemo(() => visibleContentForBatch(allContent, batchId), [allContent, batchId]);
  if (items.length === 0) return <p className="text-ink-400 italic text-sm">No notes or videos published yet.</p>;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <YouTubeCard key={item.id} url={item.url} title={item.title} subtitle={`${item.subject} · ${item.chapter}`} />
      ))}
    </div>
  );
}

function ResourceLink({ label, icon, url }: { label: string; icon: React.ReactNode; url: string }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-ink-50 text-ink-400 text-sm">
        {icon} {label} — not added yet
      </div>
    );
  }
  return <YouTubeCard url={url} title={label} />;
}

function PyqPanel() {
  const [subject, setSubject] = useState<Subject>('Physics');
  const [track, setTrack] = useState<ExamTrack>('KCET');
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const validTracks = SUBJECT_EXAM_TRACKS[subject];
  const activeTrack = validTracks.includes(track) ? track : validTracks[0];
  const [chapters, setChapters] = useState<ChapterResource[]>([]);
  useEffect(() => subscribeChapterResources(activeTrack, subject, setChapters), [activeTrack, subject]);

  function handleSubjectChange(s: Subject) {
    setSubject(s);
    setOpenChapter(null);
    if (!SUBJECT_EXAM_TRACKS[s].includes(track)) setTrack(SUBJECT_EXAM_TRACKS[s][0]);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center flex-wrap">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => handleSubjectChange(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${subject === s ? 'bg-gold-400 text-ink-900' : 'bg-ink-100 text-ink-500'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-center">
        {validTracks.map((t) => (
          <button
            key={t}
            onClick={() => { setTrack(t); setOpenChapter(null); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${activeTrack === t ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
          >
            {t} PYQ
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-400 text-center">{subject} · {chapters.length} chapters</p>

      <div className="space-y-2">
        {chapters.map((c) => (
          <div key={c.id} className="bg-white border-2 border-ink-200 rounded-3xl overflow-hidden">
            <button
              onClick={() => setOpenChapter(openChapter === c.id ? null : c.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-semibold text-ink-800 text-sm">
                {c.chapterIndex}. {c.chapterName}
              </span>
              <ChevronDown className={`w-4 h-4 text-ink-400 transition-transform ${openChapter === c.id ? 'rotate-180' : ''}`} />
            </button>
            {openChapter === c.id && (
              <div className="px-4 pb-4 space-y-2 border-t border-ink-100 pt-3">
                <ResourceLink label="Notes (Drive)" icon={<FileText className="w-4 h-4" />} url={c.notesUrl} />
                <ResourceLink label="Solved PYQ Video" icon={<Video className="w-4 h-4" />} url={c.solutionVideoUrl} />
                <ResourceLink label="Important Topics Explained" icon={<Lightbulb className="w-4 h-4" />} url={c.conceptVideoUrl} />
                <ResourceLink label="Digital NCERT Chapter" icon={<BookOpenCheck className="w-4 h-4" />} url={c.ncertUrl} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const StudentThreadCard: React.FC<{ thread: DoubtThread }> = ({ thread: t }) => {
  const [messages, setMessages] = useState<DoubtMessage[]>([]);
  const [reply, setReply] = useState('');

  useEffect(() => subscribeMessages(t.id, setMessages), [t.id]);

  function handleReply() {
    const body = reply.trim();
    if (!body) return;
    postMessage(t.id, 'student', body);
    setReply('');
  }

  return (
    <div className="bg-white border-2 border-ink-200 rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gold-100 text-gold-700'}`}>
          {t.status}
        </span>
        <h4 className="font-bold text-ink-800">{t.subject}</h4>
      </div>
      <div className="space-y-2 mb-3">
        {messages.map((m) => (
          <div key={m.id} className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] ${m.senderRole === 'admin' ? 'bg-sage-50 text-sage-900 ml-auto text-right' : 'bg-ink-50 text-ink-700'}`}>
            <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">{m.senderRole === 'admin' ? 'Teacher' : 'You'}</p>
            {m.body}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply..."
          className="flex-1 border-2 border-ink-200 rounded-2xl px-3 py-1.5 text-sm"
        />
        <button onClick={handleReply} className="p-2 rounded-2xl bg-ink-100 hover:bg-ink-200">
          <Send className="w-4 h-4 text-ink-600" />
        </button>
      </div>
    </div>
  );
};

function DoubtsPanel() {
  const studentId = getOrCreateStudentId();
  const studentName = getStudentName();
  const [threads, setThreads] = useState<DoubtThread[]>([]);
  useEffect(() => subscribeThreadsForStudent(studentId, setThreads), [studentId]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  function handleNewThread(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    createThread(studentId, studentName, subject.trim(), message.trim());
    setSubject('');
    setMessage('');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleNewThread} className="bg-white border-2 border-ink-200 rounded-3xl p-5 space-y-3">
        <h3 className="font-bold text-ink-800">Ask a Doubt</h3>
        <p className="text-xs text-ink-400">Only you and the admin/teacher can see this thread.</p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject / Chapter"
          className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your doubt..."
          rows={2}
          className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-4 py-2 rounded-2xl text-sm flex items-center gap-2">
          <Send className="w-4 h-4" /> Send
        </button>
      </form>

      {threads.length === 0 && <p className="text-ink-400 italic text-sm">No doubts asked yet.</p>}
      {threads.map((t) => (
        <StudentThreadCard key={t.id} thread={t} />
      ))}
    </div>
  );
}

const RESOURCE_STATUS_META: Record<ResourceStatus, { label: string; badge: string }> = {
  not_started: { label: 'Not Started', badge: 'bg-white border-2 border-ink-300 text-ink-500' },
  in_progress: { label: 'In Progress', badge: 'bg-gold-400 text-ink-900' },
  done: { label: 'Done', badge: 'bg-sage-500 text-white' },
};

const BookCard: React.FC<{ book: BookRef; studentId: string; onChange: () => void }> = ({ book, studentId, onChange }) => {
  const [open, setOpen] = useState(false);
  const progress = getProgress(studentId, book.id);
  const [notes, setNotes] = useState(progress.notes);

  function setStatus(status: ResourceStatus) {
    updateProgress(studentId, book.id, { status });
    onChange();
  }

  return (
    <div className="bg-white border-2 border-ink-100 rounded-3xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-900 text-sm truncate">{book.title}</p>
          <p className="text-xs text-ink-400">{book.author} &middot; {book.subject}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${RESOURCE_STATUS_META[progress.status].badge}`}>
          {RESOURCE_STATUS_META[progress.status].label}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-ink-100 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['not_started', 'in_progress', 'done'] as ResourceStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${progress.status === s ? RESOURCE_STATUS_META[s].badge : 'bg-ink-50 text-ink-500'}`}
              >
                {RESOURCE_STATUS_META[s].label}
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => updateProgress(studentId, book.id, { notes })}
            placeholder="Notes (chapters covered, where you left off...)"
            rows={2}
            className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
          />
          {book.custom && (
            <button
              onClick={() => { deleteCustomBook(studentId, book.id); onChange(); }}
              className="text-xs font-bold text-rose-400 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
};

function ResourcesPanel() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('Physics');

  const books = listAllBooks(studentId);
  const summary = progressSummary(studentId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addCustomBook(studentId, { title: title.trim(), author: author.trim(), subject });
    setTitle('');
    setAuthor('');
    setShowForm(false);
    forceUpdate();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-3 text-center">
          <p className="text-xl font-bold font-display text-sage-600">{summary.done}</p>
          <p className="text-[10px] text-ink-500 uppercase tracking-wider mt-0.5">Done</p>
        </div>
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-3 text-center">
          <p className="text-xl font-bold font-display text-gold-600">{summary.inProgress}</p>
          <p className="text-[10px] text-ink-500 uppercase tracking-wider mt-0.5">In Progress</p>
        </div>
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-3 text-center">
          <p className="text-xl font-bold font-display text-ink-900">{summary.total}</p>
          <p className="text-[10px] text-ink-500 uppercase tracking-wider mt-0.5">Total Books</p>
        </div>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ink-200 rounded-3xl py-3 text-ink-500 font-semibold hover:border-gold-300"
        >
          <Plus className="w-4 h-4" /> Add a Book
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-ink-100 rounded-3xl p-4 space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm bg-white">
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Maths</option>
              <option>Biology</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-4 py-2 rounded-2xl text-sm">
              Save
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-2xl text-ink-500 hover:bg-ink-100 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {books.map((b) => (
          <BookCard key={b.id} book={b} studentId={studentId} onChange={forceUpdate} />
        ))}
      </div>
    </div>
  );
}

export default function StudentLMS() {
  const [tab, setTab] = useState<Tab>('classes');
  const [batchId, setBatchId] = useState<string | null>(() => getStudentBatchId());
  const [batches, setBatches] = useState<Batch[]>([]);
  useEffect(() => subscribeBatches(setBatches), []);

  function handleBatchChange(id: string | null) {
    setStudentBatchId(id);
    setBatchId(id);
  }

  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: 'classes', label: 'Live Classes', icon: <Video className="w-4 h-4" /> },
    { key: 'content', label: 'Notes & Videos', icon: <FileText className="w-4 h-4" /> },
    { key: 'pyq', label: 'PYQ (KCET/NEET/JEE)', icon: <BookOpenCheck className="w-4 h-4" /> },
    { key: 'doubts', label: 'My Doubts', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'resources', label: 'Books & Resources', icon: <Library className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2">Learning Hub</h1>
        <p className="text-ink-500 text-sm">Live classes, notes, PYQs and doubts — all in one place.</p>
      </header>

      <BatchPicker batches={batches} batchId={batchId} onChange={handleBatchChange} />

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

      {tab === 'classes' && <ClassesPanel batchId={batchId} />}
      {tab === 'content' && <ContentPanel batchId={batchId} />}
      {tab === 'pyq' && <PyqPanel />}
      {tab === 'doubts' && <DoubtsPanel />}
      {tab === 'resources' && <ResourcesPanel />}
    </div>
  );
}
