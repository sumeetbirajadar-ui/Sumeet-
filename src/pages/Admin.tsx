import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Plus, Trash2, Eye, EyeOff, Pencil, Users, Video, FileText, BookOpenCheck, MessageCircle, Send, CalendarClock } from 'lucide-react';
import { TimelineEvent, subscribeTimelineEvents, addTimelineEvent, deleteTimelineEvent } from '../lib/counselling';
import {
  Announcement,
  subscribeAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../lib/announcements';
import { ENGG, AGRI, PROF } from '../data/kcet';
import { ENGG_BRANCH_OPTIONS, AGRI_BRANCH_OPTIONS, PROF_BRANCH_OPTIONS } from '../data/kcet/branchOptions';
import { CATEGORY_OPTIONS, CourseType } from '../data/kcet/meta';
import { OverrideStore, subscribeOverrideStore, listOverridesFrom, setOverride, removeOverride } from '../lib/adminOverrides';
import {
  Batch,
  subscribeBatches,
  createBatch,
  deleteBatch,
  LiveClass,
  subscribeClasses,
  createClass,
  updateClass,
  deleteClass,
  ContentItem,
  subscribeContent,
  createContent,
  updateContent,
  deleteContent,
  ExamTrack,
  EXAM_TRACKS,
  Subject,
  SUBJECTS,
  SUBJECT_EXAM_TRACKS,
  ChapterResource,
  subscribeChapterResources,
  updateChapterResource,
  addChapter,
  deleteChapter,
  DoubtThread,
  DoubtMessage,
  subscribeAllThreadsGrouped,
  subscribeMessages,
  postMessage,
  setThreadStatus,
  AttendanceRecord,
  subscribeAllAttendance,
} from '../lib/lms';

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}

function AnnouncementsPanel() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  React.useEffect(() => subscribeAnnouncements(setItems), []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (editingId) {
      updateAnnouncement(editingId, { title, body });
      setEditingId(null);
    } else {
      createAnnouncement(title, body);
    }
    setTitle('');
    setBody('');
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setTitle(a.title);
    setBody(a.body);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-white rounded-3xl border-2 border-ink-200 p-6 space-y-4">
        <h3 className="font-bold text-lg text-ink-800">{editingId ? 'Edit Announcement' : 'New Announcement'}</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 outline-none focus:border-gold-400"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details for students..."
          rows={3}
          className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 outline-none focus:border-gold-400"
        />
        <div className="flex gap-2">
          <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl flex items-center gap-2">
            <Plus className="w-4 h-4" /> {editingId ? 'Save Changes' : 'Add Draft'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTitle('');
                setBody('');
              }}
              className="px-5 py-2 rounded-2xl text-ink-500 hover:bg-ink-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-ink-400 text-sm italic">No announcements yet.</p>}
        {items.map((a) => (
          <div key={a.id} className="bg-white rounded-3xl border-2 border-ink-200 p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    a.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {a.status}
                </span>
                <h4 className="font-bold text-ink-800 truncate">{a.title}</h4>
              </div>
              {a.body && <p className="text-sm text-ink-500 whitespace-pre-wrap">{a.body}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                title={a.status === 'published' ? 'Unpublish' : 'Publish'}
                onClick={() => updateAnnouncement(a.id, { status: a.status === 'published' ? 'draft' : 'published' })}
                className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"
              >
                {a.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => startEdit(a)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteAnnouncement(a.id)}
                className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function collegeList(courseType: CourseType): Array<{ code: string; name: string }> {
  const source = courseType === 'engg' ? ENGG : courseType === 'agri' ? AGRI : PROF;
  return Object.entries(source)
    .map(([code, c]) => ({ code, name: (c as any).n as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function branchOptionsFor(courseType: CourseType) {
  return courseType === 'engg' ? ENGG_BRANCH_OPTIONS : courseType === 'agri' ? AGRI_BRANCH_OPTIONS : PROF_BRANCH_OPTIONS;
}

function CutoffOverridesPanel() {
  const [courseType, setCourseType] = useState<CourseType>('engg');
  const [collegeCode, setCollegeCode] = useState('');
  const [branch, setBranch] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState(2025);
  const [cutoff, setCutoff] = useState('');
  const [note, setNote] = useState('');
  const [store, setStore] = useState<OverrideStore>({ engg: {}, agri: {}, prof: {} });

  useEffect(() => subscribeOverrideStore(setStore), []);

  const colleges = useMemo(() => collegeList(courseType), [courseType]);
  const branches = branchOptionsFor(courseType);
  const overrides = listOverridesFrom(store, courseType);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(cutoff);
    if (!collegeCode || !branch || !category || !val) return;
    setOverride(store, courseType, collegeCode, branch, category, year, val, note || undefined);
    setCutoff('');
    setNote('');
  }

  function collegeName(code: string) {
    const source = courseType === 'engg' ? ENGG : courseType === 'agri' ? AGRI : PROF;
    return (source as any)[code]?.n || code;
  }

  return (
    <div className="space-y-6">
      <div className="bg-sage-50 border border-sage-100 text-sage-800 text-xs rounded-3xl px-4 py-3">
        Enter a real, officially published cutoff for 2025/2026 here once KEA releases it. It will show as
        "Official" in the predictor instead of the trend-based estimate. Never enter a figure you haven't verified
        against the official KEA cutoff PDF.
      </div>

      <form onSubmit={handleAdd} className="bg-white rounded-3xl border-2 border-ink-200 p-6 space-y-4">
        <h3 className="font-bold text-lg text-ink-800">Add / Update Official Cutoff</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={courseType}
            onChange={(e) => {
              setCourseType(e.target.value as CourseType);
              setCollegeCode('');
              setBranch('');
            }}
            className="border-2 border-ink-200 rounded-2xl px-3 py-2 bg-white"
          >
            <option value="engg">Engineering</option>
            <option value="agri">Agriculture</option>
            <option value="prof">Veterinary / Professional</option>
          </select>
          <select value={collegeCode} onChange={(e) => setCollegeCode(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 bg-white">
            <option value="">-- College --</option>
            {colleges.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 bg-white">
            <option value="">-- Branch / Course --</option>
            {branches.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 bg-white">
            <option value="">-- Category --</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="border-2 border-ink-200 rounded-2xl px-3 py-2 bg-white">
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <input
            type="number"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            placeholder="Closing rank"
            className="border-2 border-ink-200 rounded-2xl px-3 py-2"
          />
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Source note (e.g. 'KEA Round 2 PDF, 12 Aug 2026')"
          className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2"
        />
        <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Save
        </button>
      </form>

      <div className="bg-white rounded-3xl border-2 border-ink-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-ink-500 uppercase text-xs">
            <tr>
              <th className="text-left px-4 py-3">College</th>
              <th className="text-left px-4 py-3">Branch</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-right px-4 py-3">Year</th>
              <th className="text-right px-4 py-3">Cutoff</th>
              <th className="text-left px-4 py-3">Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {overrides.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-400 italic py-6">
                  No official overrides entered yet — predictor is showing trend estimates only.
                </td>
              </tr>
            )}
            {overrides.map((o) => (
              <tr key={`${o.collegeCode}-${o.branch}-${o.category}-${o.entry.year}`}>
                <td className="px-4 py-3">{collegeName(o.collegeCode)}</td>
                <td className="px-4 py-3">{o.branch}</td>
                <td className="px-4 py-3">{o.category}</td>
                <td className="px-4 py-3 text-right">{o.entry.year}</td>
                <td className="px-4 py-3 text-right font-semibold">{o.entry.cutoff.toLocaleString()}</td>
                <td className="px-4 py-3 text-ink-500">{o.entry.note || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => removeOverride(store, courseType, o.collegeCode, o.branch, o.category, o.entry.year)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BatchesPanel() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [name, setName] = useState('');
  const [examTrack, setExamTrack] = useState<Batch['examTrack']>('KCET');
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => subscribeBatches(setBatches), []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createBatch(name.trim(), examTrack, year);
    setName('');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-white rounded-3xl border-2 border-ink-200 p-6 space-y-4">
        <h3 className="font-bold text-lg text-ink-800">New Batch</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Batch name (e.g. PUC-II Science A)" className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
          <select value={examTrack} onChange={(e) => setExamTrack(e.target.value as Batch['examTrack'])} className="border-2 border-ink-200 rounded-2xl px-3 py-2 bg-white">
            <option value="KCET">KCET</option>
            <option value="NEET">NEET</option>
            <option value="JEE">JEE</option>
            <option value="Other">Other</option>
          </select>
          <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
        </div>
        <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Batch
        </button>
      </form>

      <div className="space-y-3">
        {batches.length === 0 && <p className="text-ink-400 italic text-sm">No batches yet — content without a batch is visible to all students.</p>}
        {batches.map((b) => (
          <div key={b.id} className="bg-white border-2 border-ink-200 rounded-3xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-ink-400" />
              <span className="font-bold text-ink-800">{b.name}</span>
              <span className="text-xs text-ink-500">{b.examTrack} · {b.year}</span>
            </div>
            <button onClick={() => deleteBatch(b.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BatchMultiSelect({ batches, selected, onChange }: { batches: Batch[]; selected: string[]; onChange: (ids: string[]) => void }) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  if (batches.length === 0) return <p className="text-xs text-ink-400 italic">No batches created — this will be visible to all students.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {batches.map((b) => (
        <button
          type="button"
          key={b.id}
          onClick={() => toggle(b.id)}
          className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
            selected.includes(b.id) ? 'bg-ink-800 text-white border-ink-800' : 'border-ink-200 text-ink-500'
          }`}
        >
          {b.name}
        </button>
      ))}
    </div>
  );
}

function ClassesAdminPanel() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [batchIds, setBatchIds] = useState<string[]>([]);

  useEffect(() => subscribeBatches(setBatches), []);
  useEffect(() => subscribeClasses(setClasses), []);
  useEffect(() => subscribeAllAttendance(setAttendance), []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scheduledStart || !joinUrl.trim()) return;
    createClass({ title: title.trim(), subject, chapter, batchIds, scheduledStart: new Date(scheduledStart).toISOString(), joinUrl: joinUrl.trim() });
    setTitle('');
    setSubject('');
    setChapter('');
    setJoinUrl('');
    setBatchIds([]);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-white rounded-3xl border-2 border-ink-200 p-6 space-y-4">
        <h3 className="font-bold text-lg text-ink-800">Schedule a Live Class</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Class title" className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
          <input type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
          <input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Chapter" className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
        </div>
        <input
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
          placeholder="Join link (Google Meet / YouTube / Zoom URL)"
          className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2"
        />
        <div>
          <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-2 block">Target Batches</label>
          <BatchMultiSelect batches={batches} selected={batchIds} onChange={setBatchIds} />
        </div>
        <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Save as Draft
        </button>
      </form>

      <div className="space-y-3">
        {classes.length === 0 && <p className="text-ink-400 italic text-sm">No classes scheduled yet.</p>}
        {classes.map((c) => {
          const attendedCount = attendance.filter((a) => a.classId === c.id).length;
          return (
            <div key={c.id} className="bg-white border-2 border-ink-200 rounded-3xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-ink-100 text-ink-600">{c.publishState}</span>
                    <h4 className="font-bold text-ink-800">{c.title}</h4>
                  </div>
                  <p className="text-xs text-ink-500">
                    {c.subject} · {c.chapter} · {new Date(c.scheduledStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                    {attendedCount} attended
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={c.publishState}
                    onChange={(e) => updateClass(c.id, { publishState: e.target.value as LiveClass['publishState'] })}
                    className="text-xs border-2 border-ink-200 rounded-lg px-2 py-1 bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="ended">Ended</option>
                  </select>
                  <button onClick={() => deleteClass(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContentAdminPanel() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [kind, setKind] = useState<ContentItem['kind']>('note');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [url, setUrl] = useState('');
  const [batchIds, setBatchIds] = useState<string[]>([]);

  useEffect(() => subscribeBatches(setBatches), []);
  useEffect(() => subscribeContent(setItems), []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    createContent({ kind, title: title.trim(), subject, chapter, url: url.trim(), batchIds });
    setTitle('');
    setUrl('');
    setBatchIds([]);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-white rounded-3xl border-2 border-ink-200 p-6 space-y-4">
        <h3 className="font-bold text-lg text-ink-800">Publish Notes / Video</h3>
        <div className="flex gap-2">
          {(['note', 'video'] as const).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${kind === k ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
            >
              {k === 'note' ? 'PDF Note' : 'Video'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
          <input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Chapter" className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={kind === 'note' ? 'PDF link (Drive/R2/etc.)' : 'Video link (YouTube/Drive/etc.)'}
            className="border-2 border-ink-200 rounded-2xl px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-2 block">Target Batches</label>
          <BatchMultiSelect batches={batches} selected={batchIds} onChange={setBatchIds} />
        </div>
        <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add as Draft
        </button>
      </form>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-ink-400 italic text-sm">Nothing published yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="bg-white border-2 border-ink-200 rounded-3xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {item.kind === 'note' ? <FileText className="w-5 h-5 text-ink-400" /> : <Video className="w-5 h-5 text-ink-400" />}
              <div>
                <h4 className="font-bold text-ink-800">{item.title}</h4>
                <p className="text-xs text-ink-500">{item.subject} · {item.chapter}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateContent(item.id, { publishState: item.publishState === 'published' ? 'draft' : 'published' })}
                className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"
                title={item.publishState === 'published' ? 'Unpublish' : 'Publish'}
              >
                {item.publishState === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteContent(item.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChapterResourcesPanel() {
  const [subject, setSubject] = useState<Subject>('Physics');
  const [track, setTrack] = useState<ExamTrack>('KCET');
  const [newChapterName, setNewChapterName] = useState('');
  const [chapters, setChapters] = useState<ChapterResource[]>([]);
  const validTracks = SUBJECT_EXAM_TRACKS[subject];
  const activeTrack = validTracks.includes(track) ? track : validTracks[0];

  useEffect(() => subscribeChapterResources(activeTrack, subject, setChapters), [activeTrack, subject]);

  function handleSubjectChange(s: Subject) {
    setSubject(s);
    if (!SUBJECT_EXAM_TRACKS[s].includes(track)) setTrack(SUBJECT_EXAM_TRACKS[s][0]);
  }

  // Local text buffers so typing doesn't write to localStorage on every keystroke.
  const [drafts, setDrafts] = useState<Record<string, { notesUrl: string; solutionVideoUrl: string; conceptVideoUrl: string; ncertUrl: string }>>({});

  function draftFor(c: ChapterResource) {
    return drafts[c.id] || { notesUrl: c.notesUrl, solutionVideoUrl: c.solutionVideoUrl, conceptVideoUrl: c.conceptVideoUrl, ncertUrl: c.ncertUrl };
  }

  function setDraftField(c: ChapterResource, field: 'notesUrl' | 'solutionVideoUrl' | 'conceptVideoUrl' | 'ncertUrl', value: string) {
    setDrafts((d) => ({ ...d, [c.id]: { ...draftFor(c), [field]: value } }));
  }

  function commitField(c: ChapterResource, field: 'notesUrl' | 'solutionVideoUrl' | 'conceptVideoUrl' | 'ncertUrl') {
    const value = draftFor(c)[field];
    if (value === c[field]) return;
    updateChapterResource(c.id, { [field]: value });
  }

  function handleAddChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!newChapterName.trim()) return;
    addChapter(activeTrack, subject, newChapterName.trim(), chapters.length);
    setNewChapterName('');
  }

  return (
    <div className="space-y-6">
      <div className="bg-sage-50 border border-sage-100 text-sage-800 text-xs rounded-3xl px-4 py-3">
        For each chapter, paste your Drive notes link, YouTube solved-PYQ video, YouTube "important topics" video,
        and the official Digital NCERT chapter link. Students see exactly what's filled in — leave a field blank to
        hide it.
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => handleSubjectChange(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${subject === s ? 'bg-gold-400 text-ink-900' : 'bg-ink-100 text-ink-500'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2 justify-center">
        {validTracks.map((t) => (
          <button
            key={t}
            onClick={() => setTrack(t)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${activeTrack === t ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
          >
            {t} PYQ
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {chapters.map((c) => {
          const d = draftFor(c);
          return (
            <div key={c.id} className="bg-white border-2 border-ink-200 rounded-3xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-ink-800 text-sm">
                  {c.chapterIndex}. {c.chapterName}
                </h4>
                <button onClick={() => deleteChapter(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  value={d.notesUrl}
                  onChange={(e) => setDraftField(c, 'notesUrl', e.target.value)}
                  onBlur={() => commitField(c, 'notesUrl')}
                  placeholder="Drive notes link"
                  className="border-2 border-ink-200 rounded-2xl px-3 py-1.5 text-sm"
                />
                <input
                  value={d.solutionVideoUrl}
                  onChange={(e) => setDraftField(c, 'solutionVideoUrl', e.target.value)}
                  onBlur={() => commitField(c, 'solutionVideoUrl')}
                  placeholder="YouTube — solved PYQs"
                  className="border-2 border-ink-200 rounded-2xl px-3 py-1.5 text-sm"
                />
                <input
                  value={d.conceptVideoUrl}
                  onChange={(e) => setDraftField(c, 'conceptVideoUrl', e.target.value)}
                  onBlur={() => commitField(c, 'conceptVideoUrl')}
                  placeholder="YouTube — important topics"
                  className="border-2 border-ink-200 rounded-2xl px-3 py-1.5 text-sm"
                />
                <input
                  value={d.ncertUrl}
                  onChange={(e) => setDraftField(c, 'ncertUrl', e.target.value)}
                  onBlur={() => commitField(c, 'ncertUrl')}
                  placeholder="Digital NCERT chapter link"
                  className="border-2 border-ink-200 rounded-2xl px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAddChapter} className="flex gap-2">
        <input
          value={newChapterName}
          onChange={(e) => setNewChapterName(e.target.value)}
          placeholder={`Add another ${track} chapter...`}
          className="flex-1 border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-4 py-2 rounded-2xl flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Chapter
        </button>
      </form>
    </div>
  );
}

const AdminThreadCard: React.FC<{ thread: DoubtThread }> = ({ thread: t }) => {
  const [messages, setMessages] = useState<DoubtMessage[]>([]);
  const [reply, setReply] = useState('');

  useEffect(() => subscribeMessages(t.id, setMessages), [t.id]);

  function handleReply() {
    const body = reply.trim();
    if (!body) return;
    postMessage(t.id, 'admin', body);
    setReply('');
  }

  return (
    <div className="bg-white border-2 border-ink-200 rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gold-100 text-gold-700'}`}>
            {t.status}
          </span>
          <h4 className="font-bold text-ink-800">{t.studentName} — {t.subject}</h4>
        </div>
        <button
          onClick={() => setThreadStatus(t.id, t.status === 'resolved' ? 'open' : 'resolved')}
          className="text-xs font-bold uppercase tracking-wider text-ink-500 hover:text-ink-700"
        >
          Mark {t.status === 'resolved' ? 'Open' : 'Resolved'}
        </button>
      </div>
      <div className="space-y-2 mb-3">
        {messages.map((m) => (
          <div key={m.id} className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] ${m.senderRole === 'admin' ? 'bg-sage-50 text-sage-900 ml-auto text-right' : 'bg-ink-50 text-ink-700'}`}>
            <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">{m.senderRole === 'admin' ? 'You' : t.studentName}</p>
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

function DoubtsInboxPanel() {
  const [threads, setThreads] = useState<DoubtThread[]>([]);
  useEffect(() => subscribeAllThreadsGrouped(setThreads), []);

  if (threads.length === 0) return <p className="text-ink-400 italic text-sm">No doubts asked yet.</p>;

  return (
    <div className="space-y-4">
      {threads.map((t) => (
        <AdminThreadCard key={t.id} thread={t} />
      ))}
    </div>
  );
}

function CounsellingDatesPanel() {
  const forceUpdate = useForceUpdate();
  const [track, setTrack] = useState<ExamTrack>('KCET');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => subscribeTimelineEvents(setEvents, track), [track]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    addTimelineEvent(track, title.trim(), date, note.trim() || undefined);
    setTitle('');
    setDate('');
    setNote('');
  }

  return (
    <div className="space-y-6">
      <div className="bg-sage-50 border border-sage-100 text-sage-800 text-xs rounded-3xl px-4 py-3">
        Add each counselling milestone as KEA/NTA publishes it — registration, HLC verification, option entry,
        mock allotment, Round 1/2, mop-up. Students see a live countdown and an urgency flag inside 3 days.
      </div>

      <div className="flex gap-2 justify-center">
        {EXAM_TRACKS.map((t) => (
          <button
            key={t}
            onClick={() => setTrack(t)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${track === t ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleAdd} className="bg-white rounded-3xl border-2 border-ink-200 p-6 space-y-4">
        <h3 className="font-bold text-lg text-ink-800">Add {track} Counselling Date</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone (e.g. Option Entry Opens)" className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2" />
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2" />
        <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      <div className="space-y-3">
        {events.length === 0 && <p className="text-ink-400 italic text-sm">No dates added yet for {track}.</p>}
        {events.map((e) => (
          <div key={e.id} className="bg-white border-2 border-ink-200 rounded-3xl p-4 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-ink-800">{e.title}</h4>
              <p className="text-xs text-ink-500">
                {new Date(e.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                {e.note ? ` · ${e.note}` : ''}
              </p>
            </div>
            <button onClick={() => deleteTimelineEvent(e.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<'announcements' | 'cutoffs' | 'batches' | 'classes' | 'content' | 'pyq' | 'doubts' | 'counselling'>('announcements');

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2 flex items-center justify-center gap-2">
          <ShieldCheck className="w-7 h-7 text-gold-500" /> Admin
        </h1>
        <p className="text-ink-500 text-sm">Publish content students see, and correct the predictor with real cutoffs as they're released.</p>
      </header>

      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {(
          [
            ['announcements', 'Announcements'],
            ['cutoffs', 'KCET Cutoffs'],
            ['batches', 'Batches'],
            ['classes', 'Live Classes'],
            ['content', 'Notes & Videos'],
            ['pyq', 'PYQ / Chapters'],
            ['doubts', 'Doubts Inbox'],
            ['counselling', 'Counselling Dates'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${
              tab === key ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'announcements' && <AnnouncementsPanel />}
      {tab === 'cutoffs' && <CutoffOverridesPanel />}
      {tab === 'batches' && <BatchesPanel />}
      {tab === 'classes' && <ClassesAdminPanel />}
      {tab === 'content' && <ContentAdminPanel />}
      {tab === 'pyq' && <ChapterResourcesPanel />}
      {tab === 'doubts' && <DoubtsInboxPanel />}
      {tab === 'counselling' && <CounsellingDatesPanel />}
    </div>
  );
}
