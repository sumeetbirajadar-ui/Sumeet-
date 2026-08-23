import React, { useEffect, useRef, useState } from 'react';
import { Flame, Plus, Trash2, CheckCircle2, Sparkles, Play, Pause, RotateCcw, BookOpen, Timer as TimerIcon } from 'lucide-react';
import {
  Habit,
  listHabits,
  createHabit,
  deleteHabit,
  toggleHabitLog,
  isDoneOn,
  currentStreak,
  needsRecovery,
  heatmapData,
  weeklyCompletionPct,
  seedStarterHabits,
} from '../lib/habits';
import { FOCUS_MODES, FocusMode, StudySession, listSessions, logSession, subjectDistribution, minutesToday, minutesThisWeek } from '../lib/focus';
import { getOrCreateStudentId } from '../lib/studentIdentity';
import { Subject, SUBJECTS, SUBJECT_CHAPTERS } from '../lib/lms';

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function HeatmapGrid({ days }: { days: { date: string; pct: number }[] }) {
  const weeks: { date: string; pct: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  function cellClass(pct: number) {
    if (pct === 0) return 'bg-ink-100';
    if (pct < 0.34) return 'bg-sage-200';
    if (pct < 0.67) return 'bg-sage-400';
    return 'bg-sage-600';
  }
  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((d) => (
            <div key={d.date} title={d.date} className={`w-3 h-3 rounded-sm ${cellClass(d.pct)}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function HabitsPanel() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  useEffect(() => {
    seedStarterHabits(studentId);
    forceUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const habits = listHabits(studentId).filter((h) => h.active);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [identityStatement, setIdentityStatement] = useState('');
  const [cue, setCue] = useState('');
  const [routine, setRoutine] = useState('');
  const [reward, setReward] = useState('');
  const [twoMinVersion, setTwoMinVersion] = useState('');
  const [keystone, setKeystone] = useState(false);

  function handleToggle(habitId: string) {
    toggleHabitLog(studentId, habitId, today());
    forceUpdate();
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createHabit(studentId, { name: name.trim(), identityStatement, cue, routine, reward, twoMinVersion, keystone });
    setName('');
    setIdentityStatement('');
    setCue('');
    setRoutine('');
    setReward('');
    setTwoMinVersion('');
    setKeystone(false);
    setShowForm(false);
    forceUpdate();
  }

  const weekPct = weeklyCompletionPct(studentId);
  const days = heatmapData(studentId);

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-ink-100 rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500">7-Day Consistency</h3>
          <span className="text-lg font-bold font-display text-sage-600">{weekPct}%</span>
        </div>
        <HeatmapGrid days={days} />
      </div>

      <div className="space-y-3">
        {habits.map((h) => {
          const done = isDoneOn(studentId, h.id, today());
          const streak = currentStreak(studentId, h.id);
          const recovery = needsRecovery(studentId, h.id);
          return (
            <div key={h.id} className="bg-white border-2 border-ink-100 rounded-3xl p-4">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => handleToggle(h.id)} className="flex items-start gap-3 flex-1 text-left">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      done ? 'bg-sage-500 border-sage-500 scale-105' : 'border-ink-300'
                    }`}
                  >
                    {done && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink-900 text-sm">{h.name}</p>
                      {h.keystone && <span className="text-[10px] font-bold uppercase tracking-wider bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">Keystone</span>}
                    </div>
                    {h.identityStatement && <p className="text-xs text-ink-400 italic mt-0.5">"{h.identityStatement}"</p>}
                    {streak > 0 && (
                      <p className="text-xs text-clay-500 font-semibold flex items-center gap-1 mt-1">
                        <Flame className="w-3.5 h-3.5" /> {streak}-day streak
                      </p>
                    )}
                  </div>
                </button>
                <button onClick={() => { deleteHabit(studentId, h.id); forceUpdate(); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {recovery && (
                <div className="mt-3 bg-gold-50 border border-gold-200 rounded-2xl px-3 py-2 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-gold-800">
                    Missed yesterday — that's just an accident. Get back on track today, even with{' '}
                    {h.twoMinVersion ? <span className="font-semibold">"{h.twoMinVersion}"</span> : 'a small version of it'}.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ink-200 rounded-3xl py-4 text-ink-500 font-semibold hover:border-gold-300"
        >
          <Plus className="w-4 h-4" /> Add a Habit
        </button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white border-2 border-ink-100 rounded-3xl p-5 space-y-3">
          <h3 className="font-bold text-ink-800">New Habit</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit name" className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          <input
            value={identityStatement}
            onChange={(e) => setIdentityStatement(e.target.value)}
            placeholder="Identity statement (e.g. 'I am someone who...')"
            className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input value={cue} onChange={(e) => setCue(e.target.value)} placeholder="Cue" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
            <input value={routine} onChange={(e) => setRoutine(e.target.value)} placeholder="Routine" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
            <input value={reward} onChange={(e) => setReward(e.target.value)} placeholder="Reward" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          </div>
          <input
            value={twoMinVersion}
            onChange={(e) => setTwoMinVersion(e.target.value)}
            placeholder="2-minute version (for hard days)"
            className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-ink-600">
            <input type="checkbox" checked={keystone} onChange={(e) => setKeystone(e.target.checked)} /> Keystone habit
          </label>
          <div className="flex gap-2">
            <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl">
              Add Habit
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-2xl text-ink-500 hover:bg-ink-100">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function FocusPanel() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  const [mode, setMode] = useState<FocusMode>('25-5');
  const modeConfig = FOCUS_MODES.find((m) => m.value === mode)!;
  const [secondsLeft, setSecondsLeft] = useState(modeConfig.workMin * 60);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState<Subject>('Physics');
  const [chapterName, setChapterName] = useState('');
  const [distractions, setDistractions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedMinutesRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          handleComplete(modeConfig.workMin);
          return modeConfig.workMin * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function handleComplete(minutes: number) {
    logSession(studentId, { subject, chapterName, mode, minutes, distractions, note: '' });
    setRunning(false);
    setDistractions(0);
    forceUpdate();
  }

  function handleModeChange(m: FocusMode) {
    setMode(m);
    setRunning(false);
    const cfg = FOCUS_MODES.find((x) => x.value === m)!;
    setSecondsLeft(cfg.workMin * 60);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(modeConfig.workMin * 60);
  }

  function logPartialAndStop() {
    const elapsedMin = Math.round(modeConfig.workMin - secondsLeft / 60);
    if (elapsedMin > 0) logSession(studentId, { subject, chapterName, mode, minutes: elapsedMin, distractions, note: '(ended early)' });
    setRunning(false);
    setSecondsLeft(modeConfig.workMin * 60);
    setDistractions(0);
    forceUpdate();
  }

  const format = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const total = modeConfig.workMin * 60;
  const progress = 1 - secondsLeft / total;
  const sessions = listSessions(studentId).slice(0, 8);
  const distribution = subjectDistribution(studentId);
  const maxMinutes = Math.max(...distribution.map((d) => d.minutes), 1);

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-ink-100 rounded-3xl p-6 flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {FOCUS_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => handleModeChange(m.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${mode === m.value ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value as Subject); setChapterName(''); }}
            className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm bg-white"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={chapterName} onChange={(e) => setChapterName(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm bg-white">
            <option value="">Any chapter</option>
            {SUBJECT_CHAPTERS[subject].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-ink-100)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--color-gold-400)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-ink-900 font-display">{format(secondsLeft)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setRunning((r) => !r)} className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow">
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button onClick={reset} className="p-2.5 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-600">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => setDistractions((d) => d + 1)} className="text-xs font-bold text-ink-500 bg-ink-100 px-3 py-2 rounded-full">
            Distracted ({distractions})
          </button>
        </div>
        {running && (
          <button onClick={logPartialAndStop} className="text-xs text-ink-400 underline">
            End session now &amp; log time
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-4 text-center">
          <p className="text-2xl font-bold font-display text-ink-900">{minutesToday(studentId)}m</p>
          <p className="text-xs text-ink-500">Today</p>
        </div>
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-4 text-center">
          <p className="text-2xl font-bold font-display text-ink-900">{minutesThisWeek(studentId)}m</p>
          <p className="text-xs text-ink-500">This Week</p>
        </div>
      </div>

      {distribution.length > 0 && (
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500 mb-3">Subject Distribution</h3>
          <div className="space-y-2">
            {distribution.map((d) => (
              <div key={d.subject} className="flex items-center gap-2">
                <span className="text-xs w-20 shrink-0 text-ink-600">{d.subject}</span>
                <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gold-400" style={{ width: `${(d.minutes / maxMinutes) * 100}%` }} />
                </div>
                <span className="text-xs text-ink-400 w-12 text-right">{d.minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500">Recent Sessions</h3>
          {sessions.map((s: StudySession) => (
            <div key={s.id} className="bg-white border-2 border-ink-100 rounded-2xl px-4 py-2.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-ink-400 shrink-0" />
                <span className="text-ink-700 truncate">
                  {s.subject} {s.chapterName ? `· ${s.chapterName}` : ''}
                </span>
              </div>
              <span className="text-ink-400 shrink-0">{s.minutes}m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HabitsFocus() {
  const [tab, setTab] = useState<'habits' | 'focus'>('habits');
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2">Habits &amp; Focus</h1>
        <p className="text-ink-500 text-sm">Build the daily discipline that compounds into results.</p>
      </header>
      <div className="flex gap-2 mb-6 justify-center">
        <button onClick={() => setTab('habits')} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${tab === 'habits' ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}>
          <Flame className="w-4 h-4" /> Habits
        </button>
        <button onClick={() => setTab('focus')} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${tab === 'focus' ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}>
          <TimerIcon className="w-4 h-4" /> Focus Timer
        </button>
      </div>
      {tab === 'habits' ? <HabitsPanel /> : <FocusPanel />}
    </div>
  );
}
