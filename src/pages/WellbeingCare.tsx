import React, { useState } from 'react';
import { HeartHandshake, Sparkles, Phone, CheckCircle2, Circle } from 'lucide-react';
import { JournalEntry, listEntries, todayEntry, saveTodayEntry, recentStressTrend, needsSupportSignal, TELE_MANAS_MESSAGE } from '../lib/wellbeing';
import { listCareItems, seedStarterCareItems, isDoneToday, toggleCareLog, todayCompletionPct } from '../lib/personalCare';
import { getOrCreateStudentId } from '../lib/studentIdentity';

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}

const MOOD_FACES = ['😞', '🙁', '😐', '🙂', '😄'];

function SupportBanner() {
  return (
    <div className="bg-sage-50 border-2 border-sage-200 rounded-3xl p-4 flex items-start gap-3">
      <Phone className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-sm text-sage-800 mb-1">You don't have to carry this alone</p>
        <p className="text-sm text-sage-700">{TELE_MANAS_MESSAGE}</p>
      </div>
    </div>
  );
}

function JournalPanel() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  const existing = todayEntry(studentId);
  const [mood, setMood] = useState(existing?.mood ?? 3);
  const [stressLevel, setStressLevel] = useState(existing?.stressLevel ?? 3);
  const [sleepHours, setSleepHours] = useState<number | ''>(existing?.sleepHours ?? '');
  const [gratitude, setGratitude] = useState(existing?.gratitude ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const entries = listEntries(studentId);
  const trend = recentStressTrend(studentId, 7);
  const showSupport = needsSupportSignal(studentId);

  function handleSave() {
    saveTodayEntry(studentId, { mood, stressLevel, sleepHours: sleepHours === '' ? null : Number(sleepHours), gratitude, notes });
    setSaved(true);
    forceUpdate();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {showSupport && <SupportBanner />}

      <div className="bg-white border-2 border-ink-100 rounded-3xl p-5 space-y-4">
        <h3 className="font-bold text-ink-800">{existing ? "Today's Check-in" : "How's today going?"}</h3>

        <div>
          <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-2 block">Mood</label>
          <div className="flex gap-2 justify-between">
            {MOOD_FACES.map((face, i) => (
              <button
                key={i}
                onClick={() => setMood(i + 1)}
                className={`text-2xl w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${mood === i + 1 ? 'bg-gold-100 border-2 border-gold-400 scale-110' : 'bg-ink-50 border-2 border-transparent'}`}
              >
                {face}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-2 block">Stress Level — {stressLevel}/5</label>
          <input type="range" min={1} max={5} value={stressLevel} onChange={(e) => setStressLevel(Number(e.target.value))} className="w-full accent-clay-400" />
        </div>

        <div>
          <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">Sleep (hours)</label>
          <input
            type="number"
            min={0}
            max={14}
            step={0.5}
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">One thing you're grateful for</label>
          <input value={gratitude} onChange={(e) => setGratitude(e.target.value)} className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">Anything else on your mind</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
        </div>

        <button onClick={handleSave} className="w-full bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold py-2.5 rounded-2xl">
          {saved ? 'Saved!' : existing ? 'Update Check-in' : 'Save Check-in'}
        </button>
      </div>

      <div className="bg-white border-2 border-ink-100 rounded-3xl p-4">
        <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500 mb-3">This Week's Stress</h3>
        <div className="flex items-end gap-2 h-20">
          {trend.map((p) => (
            <div key={p.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div
                className={`w-full rounded-t-lg ${p.stressLevel === 0 ? 'bg-ink-50' : p.stressLevel >= 4 ? 'bg-clay-400' : 'bg-sage-300'}`}
                style={{ height: `${p.stressLevel === 0 ? 4 : (p.stressLevel / 5) * 100}%` }}
              />
              <span className="text-[10px] text-ink-400">{p.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {entries.length > 1 && (
        <div className="space-y-2">
          <h3 className="font-bold text-sm uppercase tracking-wider text-ink-500">Recent Entries</h3>
          {entries.slice(1, 6).map((e: JournalEntry) => (
            <div key={e.id} className="bg-white border-2 border-ink-100 rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <span className="text-lg">{MOOD_FACES[e.mood - 1]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-400">{e.date} &middot; stress {e.stressLevel}/5{e.sleepHours != null ? ` · ${e.sleepHours}h sleep` : ''}</p>
                {e.gratitude && <p className="text-sm text-ink-700 truncate">{e.gratitude}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CarePanel() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  React.useEffect(() => {
    seedStarterCareItems(studentId);
    forceUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = listCareItems(studentId);
  const pct = todayCompletionPct(studentId);

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-ink-100 rounded-3xl p-5 text-center">
        <p className="text-3xl font-bold font-display text-sage-600">{pct}%</p>
        <p className="text-xs text-ink-500 mt-1">of today's care basics done</p>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const done = isDoneToday(studentId, item.id);
          return (
            <button
              key={item.id}
              onClick={() => {
                toggleCareLog(studentId, item.id);
                forceUpdate();
              }}
              className="w-full flex items-center gap-3 bg-white border-2 border-ink-100 rounded-3xl px-4 py-3.5 text-left"
            >
              {done ? <CheckCircle2 className="w-6 h-6 text-sage-500 shrink-0" /> : <Circle className="w-6 h-6 text-ink-300 shrink-0" />}
              <span className={`text-sm font-medium ${done ? 'text-ink-400 line-through' : 'text-ink-800'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function WellbeingCare() {
  const [tab, setTab] = useState<'journal' | 'care'>('journal');
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2 flex items-center justify-center gap-2">
          <HeartHandshake className="w-7 h-7 text-gold-500" /> Wellbeing &amp; Care
        </h1>
        <p className="text-ink-500 text-sm">A quiet check-in with yourself — because you're more than your marks.</p>
      </header>
      <div className="flex gap-2 mb-6 justify-center">
        <button onClick={() => setTab('journal')} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${tab === 'journal' ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}>
          <Sparkles className="w-4 h-4" /> Journal
        </button>
        <button onClick={() => setTab('care')} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${tab === 'care' ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}>
          <HeartHandshake className="w-4 h-4" /> Personal Care
        </button>
      </div>
      {tab === 'journal' ? <JournalPanel /> : <CarePanel />}
    </div>
  );
}
