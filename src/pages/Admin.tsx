import React, { useMemo, useState } from 'react';
import { ShieldCheck, Plus, Trash2, Eye, EyeOff, Pencil } from 'lucide-react';
import {
  Announcement,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../lib/announcements';
import { ENGG, AGRI, PROF } from '../data/kcet';
import { ENGG_BRANCH_OPTIONS, AGRI_BRANCH_OPTIONS, PROF_BRANCH_OPTIONS } from '../data/kcet/branchOptions';
import { CATEGORY_OPTIONS, CourseType } from '../data/kcet/meta';
import { listOverrides, setOverride, removeOverride } from '../lib/adminOverrides';

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}

function AnnouncementsPanel() {
  const forceUpdate = useForceUpdate();
  const [items, setItems] = useState<Announcement[]>(() => listAnnouncements());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  function refresh() {
    setItems(listAnnouncements());
    forceUpdate();
  }

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
    refresh();
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setTitle(a.title);
    setBody(a.body);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-white rounded-3xl border-2 border-stone-200 p-6 space-y-4">
        <h3 className="font-bold text-lg text-stone-800">{editingId ? 'Edit Announcement' : 'New Announcement'}</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details for students..."
          rows={3}
          className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400"
        />
        <div className="flex gap-2">
          <button type="submit" className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold px-5 py-2 rounded-xl flex items-center gap-2">
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
              className="px-5 py-2 rounded-xl text-stone-500 hover:bg-stone-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-stone-400 text-sm italic">No announcements yet.</p>}
        {items.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border-2 border-stone-200 p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    a.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {a.status}
                </span>
                <h4 className="font-bold text-stone-800 truncate">{a.title}</h4>
              </div>
              {a.body && <p className="text-sm text-stone-500 whitespace-pre-wrap">{a.body}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                title={a.status === 'published' ? 'Unpublish' : 'Publish'}
                onClick={() => {
                  updateAnnouncement(a.id, { status: a.status === 'published' ? 'draft' : 'published' });
                  refresh();
                }}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
              >
                {a.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => startEdit(a)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500">
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  deleteAnnouncement(a.id);
                  refresh();
                }}
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
  const forceUpdate = useForceUpdate();
  const [courseType, setCourseType] = useState<CourseType>('engg');
  const [collegeCode, setCollegeCode] = useState('');
  const [branch, setBranch] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState(2025);
  const [cutoff, setCutoff] = useState('');
  const [note, setNote] = useState('');

  const colleges = useMemo(() => collegeList(courseType), [courseType]);
  const branches = branchOptionsFor(courseType);
  const overrides = useMemo(() => listOverrides(courseType), [courseType]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(cutoff);
    if (!collegeCode || !branch || !category || !val) return;
    setOverride(courseType, collegeCode, branch, category, year, val, note || undefined);
    setCutoff('');
    setNote('');
    forceUpdate();
  }

  function collegeName(code: string) {
    const source = courseType === 'engg' ? ENGG : courseType === 'agri' ? AGRI : PROF;
    return (source as any)[code]?.n || code;
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs rounded-2xl px-4 py-3">
        Enter a real, officially published cutoff for 2025/2026 here once KEA releases it. It will show as
        "Official" in the predictor instead of the trend-based estimate. Never enter a figure you haven't verified
        against the official KEA cutoff PDF.
      </div>

      <form onSubmit={handleAdd} className="bg-white rounded-3xl border-2 border-stone-200 p-6 space-y-4">
        <h3 className="font-bold text-lg text-stone-800">Add / Update Official Cutoff</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={courseType}
            onChange={(e) => {
              setCourseType(e.target.value as CourseType);
              setCollegeCode('');
              setBranch('');
            }}
            className="border-2 border-stone-200 rounded-xl px-3 py-2 bg-white"
          >
            <option value="engg">Engineering</option>
            <option value="agri">Agriculture</option>
            <option value="prof">Veterinary / Professional</option>
          </select>
          <select value={collegeCode} onChange={(e) => setCollegeCode(e.target.value)} className="border-2 border-stone-200 rounded-xl px-3 py-2 bg-white">
            <option value="">-- College --</option>
            {colleges.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border-2 border-stone-200 rounded-xl px-3 py-2 bg-white">
            <option value="">-- Branch / Course --</option>
            {branches.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border-2 border-stone-200 rounded-xl px-3 py-2 bg-white">
            <option value="">-- Category --</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="border-2 border-stone-200 rounded-xl px-3 py-2 bg-white">
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <input
            type="number"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            placeholder="Closing rank"
            className="border-2 border-stone-200 rounded-xl px-3 py-2"
          />
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Source note (e.g. 'KEA Round 2 PDF, 12 Aug 2026')"
          className="w-full border-2 border-stone-200 rounded-xl px-3 py-2"
        />
        <button type="submit" className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold px-5 py-2 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Save
        </button>
      </form>

      <div className="bg-white rounded-3xl border-2 border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase text-xs">
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
          <tbody className="divide-y divide-stone-100">
            {overrides.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-stone-400 italic py-6">
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
                <td className="px-4 py-3 text-stone-500">{o.entry.note || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      removeOverride(courseType, o.collegeCode, o.branch, o.category, o.entry.year);
                      forceUpdate();
                    }}
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

export default function Admin() {
  const [tab, setTab] = useState<'announcements' | 'cutoffs'>('announcements');

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight uppercase font-display mb-2 flex items-center justify-center gap-2">
          <ShieldCheck className="w-7 h-7 text-amber-500" /> Admin
        </h1>
        <p className="text-stone-500 text-sm">Publish content students see, and correct the predictor with real cutoffs as they're released.</p>
      </header>

      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setTab('announcements')}
          className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${
            tab === 'announcements' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'
          }`}
        >
          Announcements
        </button>
        <button
          onClick={() => setTab('cutoffs')}
          className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${
            tab === 'cutoffs' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'
          }`}
        >
          KCET Cutoffs
        </button>
      </div>

      {tab === 'announcements' ? <AnnouncementsPanel /> : <CutoffOverridesPanel />}
    </div>
  );
}
