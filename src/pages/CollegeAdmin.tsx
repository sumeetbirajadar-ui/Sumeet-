import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Download, Printer, Users, UserCheck, UserX, Layers, IndianRupee, ArrowRightLeft } from 'lucide-react';
import {
  YEARS,
  Year,
  Session,
  todayISO,
  isSunday,
  Section,
  subscribeSections,
  createSection,
  updateSection,
  deleteSection,
  CollegeStudent,
  subscribeStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  parseStudentLines,
  SectionTransfer,
  subscribeTransfers,
  transferStudent,
  Lecturer,
  subscribeLecturers,
  createLecturer,
  updateLecturer,
  deleteLecturer,
  SectionAttendance,
  subscribeAttendance,
  saveAttendance,
  attendancePercent,
  StaffAttendanceDay,
  subscribeStaffAttendance,
  saveStaffAttendance,
  WorkLog,
  subscribeWorkLogs,
  addWorkLog,
  deleteWorkLog,
  FeePayment,
  subscribeFeePayments,
  addFeePayment,
  deleteFeePayment,
  CollegeSettings,
  subscribeCollegeSettings,
  saveCollegeSettings,
  downloadCSV,
} from '../lib/college';

// Shared live data for every College panel, subscribed once at the top so
// switching tabs doesn't re-open a dozen Firestore listeners.
interface CollegeData {
  sections: Section[];
  students: CollegeStudent[];
  lecturers: Lecturer[];
  attendance: SectionAttendance[];
  staffAttendance: StaffAttendanceDay[];
  workLogs: WorkLog[];
  fees: FeePayment[];
  transfers: SectionTransfer[];
  settings: CollegeSettings;
}

function useCollegeData(): CollegeData {
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<CollegeStudent[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [attendance, setAttendance] = useState<SectionAttendance[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendanceDay[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [fees, setFees] = useState<FeePayment[]>([]);
  const [transfers, setTransfers] = useState<SectionTransfer[]>([]);
  const [settings, setSettings] = useState<CollegeSettings>({ sundayAttendance: false });

  useEffect(() => {
    const unsubs = [
      subscribeSections(setSections),
      subscribeStudents(setStudents),
      subscribeLecturers(setLecturers),
      subscribeAttendance(setAttendance),
      subscribeStaffAttendance(setStaffAttendance),
      subscribeWorkLogs(setWorkLogs),
      subscribeFeePayments(setFees),
      subscribeTransfers(setTransfers),
      subscribeCollegeSettings(setSettings),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  return { sections, students, lecturers, attendance, staffAttendance, workLogs, fees, transfers, settings };
}

const card = 'bg-white rounded-3xl border-2 border-ink-200 p-6';
const input = 'border-2 border-ink-200 rounded-2xl px-3 py-2 outline-none focus:border-gold-400';
const primaryBtn = 'bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl flex items-center gap-2';
const ghostBtn = 'px-3 py-2 rounded-2xl text-ink-600 hover:bg-ink-100 text-sm font-bold flex items-center gap-1.5';

function sectionLabel(sections: Section[], id: string): string {
  const s = sections.find((x) => x.id === id);
  return s ? `${s.year} ${s.name}` : '—';
}

// Opens a plain printable page so the browser's "Save as PDF" gives a clean
// report without pulling in a PDF library.
function printTable(title: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => String(v).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!doctype html><title>${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}
th,td{border:1px solid #999;padding:6px 8px;text-align:left;font-size:13px}th{background:#eee}</style>
<h2>${esc(title)}</h2><table><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>
${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`);
  w.document.close();
  w.print();
}

function ExportButtons({ title, headers, rows }: { title: string; headers: string[]; rows: (string | number)[][] }) {
  const file = title.replace(/[^\w]+/g, '_');
  return (
    <div className="flex gap-1">
      <button onClick={() => printTable(title, headers, rows)} className={ghostBtn}>
        <Printer className="w-4 h-4" /> PDF
      </button>
      <button onClick={() => downloadCSV(`${file}.csv`, [headers, ...rows])} className={ghostBtn}>
        <Download className="w-4 h-4" /> CSV
      </button>
    </div>
  );
}

function SectionSelect({
  sections,
  value,
  onChange,
  allowAll,
}: {
  sections: Section[];
  value: string;
  onChange: (v: string) => void;
  allowAll?: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={input}>
      <option value="">{allowAll ? 'All Sections' : 'Select a section'}</option>
      {sections.map((s) => (
        <option key={s.id} value={s.id}>
          {s.year} {s.name}
        </option>
      ))}
    </select>
  );
}

// -------------------------------------------------------------- Dashboard --

function DashboardPanel({ d }: { d: CollegeData }) {
  const [date, setDate] = useState(todayISO());
  const active = d.students.filter((s) => s.active);
  const staffToday = d.staffAttendance.find((x) => x.id === date)?.present ?? {};
  const staffAbsent = d.lecturers.filter((l) => l.active && staffToday[l.id] === false);
  const totalFee = active.reduce((sum, s) => sum + (s.totalFee || 0), 0);
  const paid = d.fees.reduce((sum, f) => sum + f.amount, 0);

  const rows = d.sections.map((sec) => {
    const strength = active.filter((s) => s.sectionId === sec.id).length;
    const am = d.attendance.find((a) => a.date === date && a.sectionId === sec.id && a.session === 'morning');
    const pm = d.attendance.find((a) => a.date === date && a.sectionId === sec.id && a.session === 'evening');
    return { sec, strength, am, pm };
  });
  const absentToday = new Set(rows.flatMap((r) => [...(r.am?.absentIds ?? []), ...(r.pm?.absentIds ?? [])]));

  const stats: Array<[React.ReactNode, string, string | number]> = [
    [<Users className="w-5 h-5" />, 'Students', active.length],
    [<Layers className="w-5 h-5" />, 'Sections', d.sections.length],
    [<UserCheck className="w-5 h-5" />, 'Total lecturers', d.lecturers.filter((l) => l.active).length],
    [<UserX className="w-5 h-5" />, 'Absent today', absentToday.size],
    [<IndianRupee className="w-5 h-5" />, 'Fees pending', `₹${Math.max(totalFee - paid, 0).toLocaleString('en-IN')}`],
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(([icon, label, value]) => (
          <div key={label} className="bg-white rounded-3xl border-2 border-ink-200 p-4">
            <div className="text-gold-500 mb-2">{icon}</div>
            <div className="text-2xl font-bold text-ink-800">{value}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-ink-400">{label}</div>
          </div>
        ))}
      </div>

      {staffAbsent.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-4 text-rose-700 text-sm font-bold">
          Lecturers absent: {staffAbsent.map((l) => l.name).join(', ')} — Action needed: Arrange substitute!
        </div>
      )}

      <div className={card}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <h3 className="font-bold text-lg text-ink-800">Section-wise summary</h3>
            <p className="text-sm text-ink-400">For the selected date</p>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </div>
        {rows.length === 0 ? (
          <p className="text-ink-400 text-sm italic">Add sections first (Sections tab).</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-400 text-xs uppercase tracking-wider">
                <th className="py-2">Section</th>
                <th>Strength</th>
                <th>Morning</th>
                <th>Evening</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ sec, strength, am, pm }) => (
                <tr key={sec.id} className="border-t border-ink-100">
                  <td className="py-2 font-bold text-ink-700">
                    {sec.year} {sec.name}
                  </td>
                  <td>{strength}</td>
                  <td>{am ? `${strength - am.absentIds.length} present · ${am.absentIds.length} absent` : <span className="text-ink-300">Not marked</span>}</td>
                  <td>{pm ? `${strength - pm.absentIds.length} present · ${pm.absentIds.length} absent` : <span className="text-ink-300">Not marked</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------- Attendance --

function AttendancePanel({ d, adminName }: { d: CollegeData; adminName: string }) {
  const [date, setDate] = useState(todayISO());
  const [sectionId, setSectionId] = useState('');
  const [session, setSession] = useState<Session>('morning');
  const existing = d.attendance.find((a) => a.date === date && a.sectionId === sectionId && a.session === session);
  const [absent, setAbsent] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAbsent(new Set(existing?.absentIds ?? []));
    setSaved(false);
  }, [existing?.id, existing?.markedAt, date, sectionId, session]);

  const students = d.students.filter((s) => s.active && s.sectionId === sectionId);
  const sundayLocked = isSunday(date) && !d.settings.sundayAttendance;
  const corrections = d.attendance.filter((a) => a.corrected).sort((a, b) => b.markedAt.localeCompare(a.markedAt));

  function toggle(id: string) {
    const next = new Set(absent);
    next.has(id) ? next.delete(id) : next.add(id);
    setAbsent(next);
  }

  async function save() {
    await saveAttendance(existing, date, sectionId, session, [...absent], adminName);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <div className={`${card} space-y-4`}>
        <h3 className="font-bold text-lg text-ink-800">{existing ? 'Correct attendance' : 'Mark attendance'}</h3>
        <div className="flex flex-wrap gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
          <SectionSelect sections={d.sections} value={sectionId} onChange={setSectionId} />
          {(['morning', 'evening'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSession(s)}
              className={`px-4 py-2 rounded-2xl text-sm font-bold capitalize ${session === s ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {sundayLocked ? (
          <p className="text-sm text-amber-700 font-bold">Today is a Sunday — currently locked. Enable Sunday attendance in Settings.</p>
        ) : !sectionId ? (
          <p className="text-sm text-ink-400 italic">Select a section.</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No students here.</p>
        ) : (
          <>
            {existing && (
              <p className="text-xs text-ink-400">
                Last saved by {existing.markedBy} at {new Date(existing.markedAt).toLocaleString()}
              </p>
            )}
            <p className="text-sm text-ink-500">Tap a student to mark them absent. Everyone else is present.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`text-left px-4 py-2 rounded-2xl border-2 text-sm ${
                    absent.has(s.id) ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <span className="font-bold">{s.registerNo}</span> · {s.name}
                  <span className="float-right text-xs font-bold uppercase">{absent.has(s.id) ? 'Absent' : 'Present'}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={save} className={primaryBtn}>
                Save ({students.length - absent.size} present · {absent.size} absent)
              </button>
              {saved && <span className="text-emerald-600 text-sm font-bold">Saved</span>}
            </div>
          </>
        )}
      </div>

      <div className={card}>
        <h3 className="font-bold text-lg text-ink-800 mb-3">Corrections log</h3>
        {corrections.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No corrections recorded.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {corrections.slice(0, 30).map((c) => (
              <li key={c.id} className="text-ink-600">
                {c.date} · {sectionLabel(d.sections, c.sectionId)} · <span className="capitalize">{c.session}</span> — re-saved by {c.markedBy} on{' '}
                {new Date(c.markedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------- Absent lists --

function AbsentListsPanel({ d }: { d: CollegeData }) {
  const [date, setDate] = useState(todayISO());
  const byId = new Map(d.students.map((s) => [s.id, s]));

  const entries = d.attendance
    .filter((a) => a.date === date)
    .flatMap((a) => a.absentIds.map((id) => ({ student: byId.get(id), session: a.session, sectionId: a.sectionId })))
    .filter((e): e is { student: CollegeStudent; session: Session; sectionId: string } => Boolean(e.student));

  // Merge morning/evening into one row per student.
  const merged = new Map<string, { student: CollegeStudent; sectionId: string; sessions: Session[] }>();
  for (const e of entries) {
    const m = merged.get(e.student.id) ?? { student: e.student, sectionId: e.sectionId, sessions: [] };
    m.sessions.push(e.session);
    merged.set(e.student.id, m);
  }
  const list = [...merged.values()].sort(
    (a, b) => sectionLabel(d.sections, a.sectionId).localeCompare(sectionLabel(d.sections, b.sectionId)) || a.student.registerNo.localeCompare(b.student.registerNo)
  );

  const when = (s: Session[]) => (s.length === 2 ? 'Full day' : s[0] === 'morning' ? 'Morning' : 'Evening');
  // The overall list is meant for the parents' WhatsApp group, so it never
  // carries phone numbers; the section-wise one is internal and does.
  const overallRows = list.map((m) => [m.student.registerNo, m.student.name, sectionLabel(d.sections, m.sectionId), when(m.sessions)]);
  const internalRows = list.map((m) => [
    sectionLabel(d.sections, m.sectionId),
    m.student.registerNo,
    m.student.name,
    when(m.sessions),
    m.student.phone,
  ]);

  return (
    <div className="space-y-6">
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />

      <div className={card}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <h3 className="font-bold text-lg text-ink-800">Overall Absent List</h3>
            <p className="text-sm text-ink-400">No phones — safe for parent WhatsApp</p>
          </div>
          <ExportButtons title={`Absent list ${date}`} headers={['Register No', 'Name', 'Section', 'When']} rows={overallRows} />
        </div>
        {list.length === 0 ? <p className="text-sm text-ink-400 italic">No absentees recorded for this date.</p> : <SimpleTable headers={['Register No', 'Name', 'Section', 'When']} rows={overallRows} />}
      </div>

      <div className={card}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <h3 className="font-bold text-lg text-ink-800">Section Wise Absent List</h3>
            <p className="text-sm text-ink-400">Internal use only · includes parent phone</p>
          </div>
          <ExportButtons title={`Section-wise absent ${date}`} headers={['Section', 'Register No', 'Name', 'When', 'Phone']} rows={internalRows} />
        </div>
        {list.length === 0 ? <p className="text-sm text-ink-400 italic">No absentees recorded for this date.</p> : <SimpleTable headers={['Section', 'Register No', 'Name', 'When', 'Phone']} rows={internalRows} />}
      </div>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-400 text-xs uppercase tracking-wider">
            {headers.map((h) => (
              <th key={h} className="py-2 pr-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-ink-100">
              {r.map((c, j) => (
                <td key={j} className="py-2 pr-3 text-ink-700">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --------------------------------------------------------------- Students --

const emptyStudent = { name: '', registerNo: '', sectionId: '', phone: '', hostel: false, totalFee: 0 };

function StudentsPanel({ d }: { d: CollegeData }) {
  const [form, setForm] = useState(emptyStudent);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulk, setBulk] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [search, setSearch] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);

  const shown = d.students.filter(
    (s) =>
      (!filterSection || s.sectionId === filterSection) &&
      (!search || `${s.name} ${s.registerNo}`.toLowerCase().includes(search.toLowerCase()))
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.sectionId) return;
    if (editingId) await updateStudent(editingId, form);
    else await createStudent(form);
    setForm({ ...emptyStudent, sectionId: form.sectionId });
    setEditingId(null);
  }

  async function addBulk() {
    if (!form.sectionId) return;
    for (const s of parseStudentLines(bulk)) {
      await createStudent({ ...emptyStudent, ...s, sectionId: form.sectionId, totalFee: form.totalFee });
    }
    setBulk('');
  }

  const profile = d.students.find((s) => s.id === profileId);

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className={`${card} space-y-3`}>
        <h3 className="font-bold text-lg text-ink-800">{editingId ? 'Edit student' : 'Add students'}</h3>
        <div className="grid sm:grid-cols-3 gap-2">
          <input value={form.registerNo} onChange={(e) => setForm({ ...form, registerNo: e.target.value })} placeholder="Register No" className={input} />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className={input} />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Parent phone" className={input} />
          <SectionSelect sections={d.sections} value={form.sectionId} onChange={(v) => setForm({ ...form, sectionId: v })} />
          <input
            type="number"
            value={form.totalFee || ''}
            onChange={(e) => setForm({ ...form, totalFee: Number(e.target.value) || 0 })}
            placeholder="Total fee (₹)"
            className={input}
          />
          <label className="flex items-center gap-2 text-sm text-ink-600">
            <input type="checkbox" checked={form.hostel} onChange={(e) => setForm({ ...form, hostel: e.target.checked })} /> Hostel
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={primaryBtn}>
            <Plus className="w-4 h-4" /> {editingId ? 'Save changes' : 'Add student'}
          </button>
          {editingId && (
            <button type="button" onClick={() => (setEditingId(null), setForm(emptyStudent))} className={ghostBtn}>
              Cancel
            </button>
          )}
        </div>
        {!editingId && (
          <div className="pt-3 border-t border-ink-100 space-y-2">
            <p className="text-sm text-ink-500">
              Or paste many at once into the section above — one per line: <code>Register No, Name, Phone</code> (copy straight from Excel works too).
            </p>
            <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={4} className={`${input} w-full font-mono text-xs`} />
            <button type="button" onClick={addBulk} disabled={!form.sectionId || !bulk.trim()} className={`${ghostBtn} disabled:opacity-40`}>
              <Plus className="w-4 h-4" /> Add {parseStudentLines(bulk).length} students
            </button>
          </div>
        )}
      </form>

      <div className={card}>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <SectionSelect sections={d.sections} value={filterSection} onChange={setFilterSection} allowAll />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or register no" className={`${input} flex-1 min-w-[12rem]`} />
          <ExportButtons
            title="Students"
            headers={['Register No', 'Name', 'Section', 'Phone', 'Hostel', 'Status']}
            rows={shown.map((s) => [s.registerNo, s.name, sectionLabel(d.sections, s.sectionId), s.phone, s.hostel ? 'Yes' : 'No', s.active ? 'Active' : 'Inactive'])}
          />
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No students match your filters.</p>
        ) : (
          <div className="space-y-2">
            {shown.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 border-b border-ink-100 pb-2">
                <button onClick={() => setProfileId(s.id)} className="text-left min-w-0">
                  <div className={`font-bold truncate ${s.active ? 'text-ink-800' : 'text-ink-300 line-through'}`}>
                    {s.registerNo} · {s.name}
                  </div>
                  <div className="text-xs text-ink-400">
                    {sectionLabel(d.sections, s.sectionId)}
                    {s.hostel && ' · Hostel'}
                    {s.phone && ` · ${s.phone}`}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => updateStudent(s.id, { active: !s.active })}
                    className="text-xs font-bold px-2 py-1 rounded-lg bg-ink-100 text-ink-500"
                  >
                    {s.active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(s.id);
                      setForm({ name: s.name, registerNo: s.registerNo, sectionId: s.sectionId, phone: s.phone, hostel: s.hostel, totalFee: s.totalFee });
                    }}
                    className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => confirm(`Delete ${s.name}?`) && deleteStudent(s.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {profile && <StudentProfile d={d} student={profile} onClose={() => setProfileId(null)} />}
    </div>
  );
}

function StudentProfile({ d, student, onClose }: { d: CollegeData; student: CollegeStudent; onClose: () => void }) {
  const to = todayISO();
  const from30 = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const month = attendancePercent(student, d.attendance, from30, to);
  const all = attendancePercent(student, d.attendance, '0000-00-00', to);
  const paid = d.fees.filter((f) => f.studentId === student.id).reduce((s, f) => s + f.amount, 0);
  const absences = d.attendance
    .filter((a) => a.absentIds.includes(student.id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);

  return (
    <div className={`${card} border-gold-300`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-ink-800">Student Profile</h3>
          <p className="text-ink-600">
            {student.registerNo} · {student.name} · {sectionLabel(d.sections, student.sectionId)}
          </p>
        </div>
        <button onClick={onClose} className={ghostBtn}>
          Close
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center mb-4">
        <div className="bg-ink-50 rounded-2xl p-3">
          <div className="text-xl font-bold text-ink-800">{month.pct ?? '—'}%</div>
          <div className="text-xs text-ink-400">Last 30 days ({month.present}/{month.held})</div>
        </div>
        <div className="bg-ink-50 rounded-2xl p-3">
          <div className="text-xl font-bold text-ink-800">{all.pct ?? '—'}%</div>
          <div className="text-xs text-ink-400">Overall ({all.present}/{all.held})</div>
        </div>
        <div className="bg-ink-50 rounded-2xl p-3">
          <div className="text-xl font-bold text-ink-800">₹{Math.max(student.totalFee - paid, 0).toLocaleString('en-IN')}</div>
          <div className="text-xs text-ink-400">Fee due (paid ₹{paid.toLocaleString('en-IN')})</div>
        </div>
      </div>
      <h4 className="font-bold text-sm text-ink-600 mb-1">Recent absences</h4>
      {absences.length === 0 ? (
        <p className="text-sm text-ink-400 italic">None.</p>
      ) : (
        <p className="text-sm text-ink-600">{absences.map((a) => `${a.date} (${a.session})`).join(', ')}</p>
      )}
    </div>
  );
}

// --------------------------------------------------------------- Sections --

function SectionsPanel({ d }: { d: CollegeData }) {
  const [name, setName] = useState('');
  const [year, setYear] = useState<Year>('1st PUC');
  const [studentId, setStudentId] = useState('');
  const [toSection, setToSection] = useState('');
  const student = d.students.find((s) => s.id === studentId);

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          createSection(name.trim(), year);
          setName('');
        }}
        className={`${card} space-y-3`}
      >
        <h3 className="font-bold text-lg text-ink-800">Section Management</h3>
        <div className="flex flex-wrap gap-2">
          <select value={year} onChange={(e) => setYear(e.target.value as Year)} className={input}>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Section name (e.g. PCMB A)" className={`${input} flex-1`} />
          <button type="submit" className={primaryBtn}>
            <Plus className="w-4 h-4" /> New section
          </button>
        </div>
      </form>

      <div className={card}>
        {d.sections.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No sections yet.</p>
        ) : (
          <div className="space-y-2">
            {d.sections.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 flex-wrap border-b border-ink-100 pb-2">
                <div>
                  <div className="font-bold text-ink-800">
                    {s.year} {s.name}
                  </div>
                  <div className="text-xs text-ink-400">{d.students.filter((x) => x.active && x.sectionId === s.id).length} students</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-400">Class Teacher</span>
                  <select value={s.classTeacherId} onChange={(e) => updateSection(s.id, { classTeacherId: e.target.value })} className={`${input} text-sm`}>
                    <option value="">Not assigned</option>
                    {d.lecturers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => confirm(`Delete section ${s.name}? Students stay but lose their section.`) && deleteSection(s.id)}
                    className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`${card} space-y-3`}>
        <h3 className="font-bold text-lg text-ink-800 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-gold-500" /> Transfer a student
        </h3>
        <div className="flex flex-wrap gap-2">
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={input}>
            <option value="">Select a student</option>
            {d.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.registerNo} · {s.name}
              </option>
            ))}
          </select>
          {student && <span className="self-center text-sm text-ink-500">Current section: {sectionLabel(d.sections, student.sectionId)}</span>}
          <SectionSelect sections={d.sections.filter((s) => s.id !== student?.sectionId)} value={toSection} onChange={setToSection} />
          <button
            disabled={!student || !toSection}
            onClick={async () => {
              if (!student) return;
              await transferStudent(student, toSection);
              setStudentId('');
              setToSection('');
            }}
            className={`${primaryBtn} disabled:opacity-40`}
          >
            Confirm transfer
          </button>
        </div>
        <h4 className="font-bold text-sm text-ink-600 pt-2">History</h4>
        {d.transfers.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No section changes recorded yet.</p>
        ) : (
          <ul className="text-sm text-ink-600 space-y-1">
            {d.transfers.slice(0, 30).map((t) => (
              <li key={t.id}>
                {new Date(t.at).toLocaleDateString()} · {d.students.find((s) => s.id === t.studentId)?.name ?? 'Removed student'}:{' '}
                {sectionLabel(d.sections, t.fromSectionId)} → {sectionLabel(d.sections, t.toSectionId)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------- Lecturers + work log ----

function LecturersPanel({ d }: { d: CollegeData }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [log, setLog] = useState({ lecturerId: '', sectionId: '', date: todayISO(), hours: 1, topic: '' });
  const [range, setRange] = useState<'month' | 'year'>('month');

  const now = todayISO();
  const from = range === 'month' ? `${now.slice(0, 7)}-01` : `${now.slice(0, 4)}-01-01`;
  const inRange = d.workLogs.filter((w) => w.date >= from && w.date <= now);
  const hoursRows = d.lecturers.map((l) => {
    const mine = inRange.filter((w) => w.lecturerId === l.id);
    return [l.name, l.subject, mine.length, mine.reduce((s, w) => s + w.hours, 0)];
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          createLecturer(name.trim(), subject.trim(), phone.trim());
          setName('');
          setSubject('');
          setPhone('');
        }}
        className={`${card} space-y-3`}
      >
        <h3 className="font-bold text-lg text-ink-800">Add lecturers</h3>
        <div className="grid sm:grid-cols-3 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={input} />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={input} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={input} />
        </div>
        <button type="submit" className={primaryBtn}>
          <Plus className="w-4 h-4" /> Add lecturer
        </button>
      </form>

      <div className={card}>
        <h3 className="font-bold text-lg text-ink-800 mb-3">Lecturers</h3>
        {d.lecturers.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No lecturers yet.</p>
        ) : (
          d.lecturers.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 border-b border-ink-100 py-2">
              <div>
                <div className={`font-bold ${l.active ? 'text-ink-800' : 'text-ink-300 line-through'}`}>{l.name}</div>
                <div className="text-xs text-ink-400">
                  {l.subject}
                  {l.phone && ` · ${l.phone}`}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateLecturer(l.id, { active: !l.active })} className="text-xs font-bold px-2 py-1 rounded-lg bg-ink-100 text-ink-500">
                  {l.active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => confirm(`Delete ${l.name}?`) && deleteLecturer(l.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!log.lecturerId || !log.topic.trim()) return;
          addWorkLog({ ...log, topic: log.topic.trim() });
          setLog({ ...log, topic: '' });
        }}
        className={`${card} space-y-3`}
      >
        <h3 className="font-bold text-lg text-ink-800">Academic Log</h3>
        <p className="text-sm text-ink-400">Daily work diary — one entry per lecture taken</p>
        <div className="grid sm:grid-cols-5 gap-2">
          <select value={log.lecturerId} onChange={(e) => setLog({ ...log, lecturerId: e.target.value })} className={input}>
            <option value="">Lecturer</option>
            {d.lecturers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <SectionSelect sections={d.sections} value={log.sectionId} onChange={(v) => setLog({ ...log, sectionId: v })} />
          <input type="date" value={log.date} onChange={(e) => setLog({ ...log, date: e.target.value })} className={input} />
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={log.hours}
            onChange={(e) => setLog({ ...log, hours: Number(e.target.value) || 1 })}
            className={input}
            title="Hours"
          />
          <input value={log.topic} onChange={(e) => setLog({ ...log, topic: e.target.value })} placeholder="Topic covered" className={input} />
        </div>
        <button type="submit" className={primaryBtn}>
          <Plus className="w-4 h-4" /> Add entry
        </button>
      </form>

      <div className={card}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-ink-800">Teaching hours per lecturer</h3>
            {(['month', 'year'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${range === r ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
              >
                {r === 'month' ? 'This Month' : 'This Year'}
              </button>
            ))}
          </div>
          <ExportButtons
            title={`Teaching hours ${range === 'month' ? now.slice(0, 7) : now.slice(0, 4)}`}
            headers={['Lecturer', 'Subject', 'Total lectures', 'Total hours']}
            rows={hoursRows}
          />
        </div>
        <SimpleTable headers={['Lecturer', 'Subject', 'Total lectures', 'Total hours']} rows={hoursRows} />
        <h4 className="font-bold text-sm text-ink-600 mt-4 mb-1">Recent entries</h4>
        {d.workLogs.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No entries yet.</p>
        ) : (
          d.workLogs.slice(0, 20).map((w) => (
            <div key={w.id} className="flex items-center justify-between text-sm text-ink-600 py-1">
              <span>
                {w.date} · {d.lecturers.find((l) => l.id === w.lecturerId)?.name ?? '—'} · {sectionLabel(d.sections, w.sectionId)} · {w.hours}h · {w.topic}
              </span>
              <button onClick={() => deleteWorkLog(w.id)} className="p-1 text-rose-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------- Staff attendance --

function StaffAttendancePanel({ d }: { d: CollegeData }) {
  const [date, setDate] = useState(todayISO());
  const saved = d.staffAttendance.find((x) => x.id === date)?.present;
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const active = d.lecturers.filter((l) => l.active);

  useEffect(() => {
    setPresent(saved ?? Object.fromEntries(active.map((l) => [l.id, true])));
  }, [date, JSON.stringify(saved), active.length]);

  const monthPrefix = date.slice(0, 7);
  const monthDays = d.staffAttendance.filter((x) => x.id.startsWith(monthPrefix));
  const monthRows = active.map((l) => {
    const marked = monthDays.filter((x) => l.id in x.present);
    const p = marked.filter((x) => x.present[l.id]).length;
    return [l.name, marked.length, p, marked.length - p];
  });

  return (
    <div className="space-y-6">
      <div className={`${card} space-y-3`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-lg text-ink-800">Staff attendance</h3>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-ink-400 italic">Add lecturers first.</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-2">
              {active.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setPresent({ ...present, [l.id]: !present[l.id] })}
                  className={`text-left px-4 py-2 rounded-2xl border-2 text-sm ${
                    present[l.id] ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-700'
                  }`}
                >
                  <span className="font-bold">{l.name}</span> · {l.subject}
                  <span className="float-right text-xs font-bold uppercase">{present[l.id] ? 'Present' : 'Absent'}</span>
                </button>
              ))}
            </div>
            <button onClick={() => saveStaffAttendance(date, present)} className={primaryBtn}>
              Save {saved && '(update)'}
            </button>
          </>
        )}
      </div>

      <div className={card}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h3 className="font-bold text-lg text-ink-800">Month summary ({monthPrefix})</h3>
          <ExportButtons title={`Staff attendance ${monthPrefix}`} headers={['Lecturer', 'Days marked', 'Present', 'Absent']} rows={monthRows} />
        </div>
        <SimpleTable headers={['Lecturer', 'Days marked', 'Present', 'Absent']} rows={monthRows} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- Fees --

function FeesPanel({ d }: { d: CollegeData }) {
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [sectionId, setSectionId] = useState('');

  const paidBy = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of d.fees) m.set(f.studentId, (m.get(f.studentId) ?? 0) + f.amount);
    return m;
  }, [d.fees]);

  const shown = d.students.filter((s) => s.active && (!sectionId || s.sectionId === sectionId));
  const rows = shown.map((s) => {
    const paid = paidBy.get(s.id) ?? 0;
    return [s.registerNo, s.name, sectionLabel(d.sections, s.sectionId), s.totalFee, paid, Math.max(s.totalFee - paid, 0)];
  });
  const totals = rows.reduce((t, r) => [t[0] + (r[3] as number), t[1] + (r[4] as number), t[2] + (r[5] as number)], [0, 0, 0]);
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ['Total fee', totals[0]],
            ['Collected', totals[1]],
            ['Pending', totals[2]],
          ] as const
        ).map(([label, v]) => (
          <div key={label} className="bg-white rounded-3xl border-2 border-ink-200 p-4">
            <div className="text-2xl font-bold text-ink-800">{inr(v)}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-ink-400">{label}</div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const amt = Number(amount);
          if (!studentId || !amt) return;
          addFeePayment({ studentId, amount: amt, date, note: note.trim() });
          setAmount('');
          setNote('');
        }}
        className={`${card} space-y-3`}
      >
        <h3 className="font-bold text-lg text-ink-800">Record a payment</h3>
        <div className="grid sm:grid-cols-4 gap-2">
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={input}>
            <option value="">Select a student</option>
            {d.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.registerNo} · {s.name}
              </option>
            ))}
          </select>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (₹)" className={input} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Receipt no / note" className={input} />
        </div>
        <button type="submit" className={primaryBtn}>
          <Plus className="w-4 h-4" /> Save payment
        </button>
      </form>

      <div className={card}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-ink-800">Fee overview</h3>
            <SectionSelect sections={d.sections} value={sectionId} onChange={setSectionId} allowAll />
          </div>
          <ExportButtons title="Fee overview" headers={['Register No', 'Name', 'Section', 'Total', 'Paid', 'Due']} rows={rows} />
        </div>
        <SimpleTable headers={['Register No', 'Name', 'Section', 'Total', 'Paid', 'Due']} rows={rows} />
      </div>

      <div className={card}>
        <h3 className="font-bold text-lg text-ink-800 mb-3">Recent payments</h3>
        {d.fees.length === 0 ? (
          <p className="text-sm text-ink-400 italic">No payments yet.</p>
        ) : (
          d.fees.slice(0, 30).map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm text-ink-600 py-1">
              <span>
                {f.date} · {d.students.find((s) => s.id === f.studentId)?.name ?? 'Removed student'} · {inr(f.amount)}
                {f.note && ` · ${f.note}`}
              </span>
              <button onClick={() => confirm('Delete this payment?') && deleteFeePayment(f.id)} className="p-1 text-rose-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------- Settings --

function SettingsPanel({ d }: { d: CollegeData }) {
  return (
    <div className={`${card} space-y-3`}>
      <h3 className="font-bold text-lg text-ink-800">Settings</h3>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-ink-700">Enable Sunday Attendance</div>
          <div className="text-sm text-ink-400">Off by default — Sundays are locked for marking. Turn on for special class days.</div>
        </div>
        <button
          onClick={() => saveCollegeSettings({ ...d.settings, sundayAttendance: !d.settings.sundayAttendance })}
          className={`px-4 py-2 rounded-2xl text-sm font-bold ${d.settings.sundayAttendance ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-500'}`}
        >
          {d.settings.sundayAttendance ? 'ON — Turn OFF' : 'OFF — Turn ON'}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Shell --

const TABS = [
  ['dashboard', 'Dashboard'],
  ['attendance', 'Attendance'],
  ['absent', 'Absent Lists'],
  ['students', 'Students'],
  ['sections', 'Sections'],
  ['lecturers', 'Lecturers'],
  ['staff', 'Staff Attendance'],
  ['fees', 'Fees'],
  ['settings', 'Settings'],
] as const;

export default function CollegeAdmin({ adminName }: { adminName: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('dashboard');
  const d = useCollegeData();

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-1.5 flex-wrap">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${tab === key ? 'bg-gold-400 text-ink-900' : 'bg-white border-2 border-ink-200 text-ink-500'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <DashboardPanel d={d} />}
      {tab === 'attendance' && <AttendancePanel d={d} adminName={adminName} />}
      {tab === 'absent' && <AbsentListsPanel d={d} />}
      {tab === 'students' && <StudentsPanel d={d} />}
      {tab === 'sections' && <SectionsPanel d={d} />}
      {tab === 'lecturers' && <LecturersPanel d={d} />}
      {tab === 'staff' && <StaffAttendancePanel d={d} />}
      {tab === 'fees' && <FeesPanel d={d} />}
      {tab === 'settings' && <SettingsPanel d={d} />}
    </div>
  );
}
