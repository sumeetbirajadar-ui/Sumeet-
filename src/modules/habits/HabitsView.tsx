import React, { useMemo, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, ChevronDown, AlertTriangle, Flame, Minus } from 'lucide-react';
import { Habit, HabitLog, MissReason } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { uid, nowISO, todayISO } from '../../db';
import { addDays, formatFriendly, isDueOnWeekday } from '../../utils/dates';
import { computeStreak, wasHabitMissedOn } from '../../utils/discipline';
import { HabitIcon, HABIT_ICON_NAMES } from '../../utils/icons';
import { PageHeader, Card, EmptyState, Pill } from '../../components/ui/Layout';
import { Modal } from '../../components/ui/Modal';
import { Field, Input, Select, TextArea } from '../../components/ui/Field';
import { Heatmap } from '../../components/charts/Heatmap';
import { DateJump } from '../../components/ui/DateJump';
import { SketchSprout } from '../../components/sketches/Sketches';

function blankHabit(): Habit {
  return {
    id: uid(), name: '', category: 'Morning', cue: '', reward: '', identityStatement: '',
    twoMinuteVersion: '', frequency: 'daily', isKeystone: false, isNegative: false,
    icon: 'Sparkles', active: true, createdAt: nowISO(),
  };
}

export const HabitsView: React.FC = () => {
  const { items: habits, save: saveHabit, remove: removeHabit } = useCollection<Habit>('habits');
  const { items: logs, save: saveLog } = useCollection<HabitLog>('habitLogs');
  const { items: reasons, save: saveReason } = useCollection<MissReason>('missReasons');

  const [date, setDate] = useState(todayISO());
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Habit | null>(null);
  const [showHeatmapFor, setShowHeatmapFor] = useState<string | null>(null);

  const logByHabit = useMemo(() => {
    const m = new Map<string, HabitLog>();
    logs.filter((l) => l.date === date).forEach((l) => m.set(l.habitId, l));
    return m;
  }, [logs, date]);

  const dueToday = habits.filter((h) => h.active
    && (h.frequency === 'daily' || (h.frequency === 'weekly' && isDueOnWeekday(h.weekDays, date)))
    && !h.category.startsWith('Evening ·'));
  const eveningToday = habits.filter((h) => h.active && h.category === `Evening · Variant ${variant} (home ${variant === 'A' ? '5:30' : '7:30'} PM)`);

  const grouped = useMemo(() => {
    const groups = new Map<string, Habit[]>();
    [...dueToday, ...eveningToday].forEach((h) => {
      const key = h.category.startsWith('Evening ·') ? 'Evening' : h.category;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(h);
    });
    return groups;
  }, [dueToday, eveningToday]);

  const incompleteDue = [...dueToday, ...eveningToday].filter((h) => {
    const log = logByHabit.get(h.id);
    return !(log?.status === 'done');
  });

  const toggleDone = async (habit: Habit) => {
    const existing = logByHabit.get(habit.id);
    if (existing?.status === 'done') {
      await saveLog({ ...existing, status: 'missed', updatedAt: nowISO() });
    } else {
      await saveLog({
        id: existing?.id ?? uid(), habitId: habit.id, date, status: 'done',
        variant: habit.category.startsWith('Evening') ? variant === 'A' ? '530' : '730' : undefined,
        updatedAt: nowISO(),
      });
    }
  };

  const setCount = async (habit: Habit, count: number) => {
    const existing = logByHabit.get(habit.id);
    const status = count >= (habit.targetCount ?? 1) ? 'done' : count > 0 ? 'missed' : 'missed';
    await saveLog({ id: existing?.id ?? uid(), habitId: habit.id, date, status, count, updatedAt: nowISO() });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const heatmapCells = (habitId: string) => {
    return logs.filter((l) => l.habitId === habitId).map((l) => ({ date: l.date, value: l.status === 'done' ? 1 : 0 }));
  };

  const saveReasonFor = (habitId: string, text: string) => {
    const existing = reasons.find((r) => r.date === date && r.habitId === habitId);
    saveReason({ id: existing?.id ?? uid(), date, habitId, reason: text });
  };

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <PageHeader
        eyebrow="Daily Discipline"
        title="Habits"
        subtitle="One tap to log. Streaks and identity are the whole game."
        right={
          <button onClick={() => setEditing(blankHabit())} className="btn-gold flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> Habit
          </button>
        }
      />

      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => setDate(addDays(date, -1))} className="p-2 rounded-full hover:bg-gold-pale text-navy-light"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center">
          <p className="font-bold text-navy text-sm">{formatFriendly(date)}</p>
          {date !== todayISO() && (
            <button onClick={() => setDate(todayISO())} className="text-[11px] text-gold font-bold uppercase tracking-wide">Jump to today</button>
          )}
        </div>
        <button onClick={() => setDate(addDays(date, 1))} className="p-2 rounded-full hover:bg-gold-pale text-navy-light"><ChevronRight className="w-5 h-5" /></button>
        <DateJump value={date} onChange={setDate} />
      </div>

      {habits.length === 0 && (
        <EmptyState icon={<SketchSprout size={72} />} title="No habits yet" hint="Add your morning, study and evening routine to start building streaks." />
      )}

      <div className="space-y-6">
        {[...grouped.entries()].map(([groupName, groupHabits]) => (
          <div key={groupName}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60">{groupName}</h3>
              {groupName === 'Evening' && (
                <div className="flex gap-1 bg-ivory-dark rounded-full p-1">
                  {(['A', 'B'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVariant(v)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${variant === v ? 'bg-navy text-cream' : 'text-navy-light/60'}`}
                    >
                      {v === 'A' ? 'Home 5:30 PM' : 'Home 7:30 PM'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Card className="!p-0 divide-y divide-gold-soft/60 overflow-hidden">
              {groupHabits.map((habit) => {
                const log = logByHabit.get(habit.id);
                const done = log?.status === 'done';
                const showNeverMissTwice = !done && habit.frequency === 'daily'
                  && wasHabitMissedOn(habit, addDays(date, -1), logs.filter((l) => l.date === addDays(date, -1)));
                const streak = computeStreak(habit.id, logs, date);
                const isNumeric = !!habit.unit;
                const isOpen = expanded.has(habit.id);
                return (
                  <div key={habit.id} className={`p-4 transition-colors ${done ? 'bg-gold-pale/30' : ''}`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => (isNumeric ? undefined : toggleDone(habit))}
                        className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all ${
                          done ? 'bg-navy border-navy text-cream' : habit.isNegative ? 'border-navy/20 text-navy-light/50' : 'border-gold-soft text-gold'
                        }`}
                      >
                        <HabitIcon name={habit.icon} className="w-4.5 h-4.5" />
                      </button>
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => toggleExpand(habit.id)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-bold text-sm text-navy ${done ? 'line-through decoration-gold/60' : ''}`}>{habit.name}</p>
                          {habit.isKeystone && <Pill tone="gold" className="!py-0.5 !px-2 text-[9px]">Keystone</Pill>}
                          {habit.timeLabel && <span className="text-[11px] text-navy-light/50 font-medium">{habit.timeLabel}</span>}
                        </div>
                        {streak > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-flag mt-0.5">
                            <Flame className="w-3 h-3" /> {streak} day{streak > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {isNumeric ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setCount(habit, Math.max(0, (log?.count ?? 0) - 1))} className="w-6 h-6 rounded-full bg-ivory-dark text-navy-light flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                          <span className="w-10 text-center font-bold text-sm text-navy">{log?.count ?? 0}</span>
                          <button onClick={() => setCount(habit, (log?.count ?? 0) + 1)} className="w-6 h-6 rounded-full bg-gold text-cream flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                          <span className="text-[10px] text-navy-light/50 ml-1">/{habit.targetCount}</span>
                        </div>
                      ) : (
                        <button onClick={() => toggleExpand(habit.id)} className="text-navy-light/40">
                          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {showNeverMissTwice && (
                      <div className="mt-3 amber-flag rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Don't miss twice — you missed this yesterday too.
                      </div>
                    )}

                    {isOpen && (
                      <div className="mt-3 pl-12 space-y-2 text-xs text-navy-light/70">
                        {habit.identityStatement && <p className="italic">"{habit.identityStatement}"</p>}
                        {habit.cue && <p><span className="font-bold text-navy-light/50">Cue:</span> {habit.cue}</p>}
                        {habit.reward && <p><span className="font-bold text-navy-light/50">Reward:</span> {habit.reward}</p>}
                        {habit.twoMinuteVersion && <p><span className="font-bold text-navy-light/50">Hard day? Just:</span> {habit.twoMinuteVersion}</p>}
                        <div className="flex gap-3 pt-1">
                          <button onClick={() => setEditing(habit)} className="text-gold font-bold uppercase tracking-wide text-[11px]">Edit</button>
                          <button onClick={() => setShowHeatmapFor(showHeatmapFor === habit.id ? null : habit.id)} className="text-gold font-bold uppercase tracking-wide text-[11px]">
                            {showHeatmapFor === habit.id ? 'Hide' : 'View'} heatmap
                          </button>
                          <button onClick={() => removeHabit(habit.id)} className="text-amber-flag font-bold uppercase tracking-wide text-[11px] flex items-center gap-1"><Trash2 className="w-3 h-3" />Delete</button>
                        </div>
                        {showHeatmapFor === habit.id && (
                          <div className="pt-2"><Heatmap cells={heatmapCells(habit.id)} weeks={16} endDate={date} /></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          </div>
        ))}
      </div>

      {incompleteDue.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Accountability Mirror — if not done, reason:</h3>
          <Card className="space-y-3">
            {incompleteDue.map((h) => (
              <div key={h.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-navy w-32 truncate shrink-0">{h.name}</span>
                <input
                  defaultValue={reasons.find((r) => r.date === date && r.habitId === h.id)?.reason ?? ''}
                  onBlur={(e) => saveReasonFor(h.id, e.target.value)}
                  placeholder="Why not today? (honest is fine)"
                  className="planner-input text-xs flex-1"
                />
              </div>
            ))}
          </Card>
        </div>
      )}

      <HabitEditorModal habit={editing} onClose={() => setEditing(null)} onSave={async (h) => { await saveHabit(h); setEditing(null); }} allHabits={habits} />
    </div>
  );
};

const HabitEditorModal: React.FC<{ habit: Habit | null; onClose: () => void; onSave: (h: Habit) => void; allHabits: Habit[] }> = ({
  habit, onClose, onSave, allHabits,
}) => {
  const [form, setForm] = useState<Habit | null>(habit);
  React.useEffect(() => setForm(habit), [habit]);
  if (!form) return null;
  const set = <K extends keyof Habit>(k: K, v: Habit[K]) => setForm({ ...form, [k]: v });

  return (
    <Modal open={!!habit} onClose={onClose} title={habit?.name ? 'Edit Habit' : 'New Habit'}>
      <Field label="Name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. 100 MCQs solved" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category"><Input value={form.category} onChange={(e) => set('category', e.target.value)} /></Field>
        <Field label="Icon">
          <Select value={form.icon} onChange={(e) => set('icon', e.target.value)}>
            {HABIT_ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Frequency">
          <Select value={form.frequency} onChange={(e) => set('frequency', e.target.value as Habit['frequency'])}>
            <option value="daily">Daily</option>
            <option value="weekly">Specific weekdays</option>
          </Select>
        </Field>
        <Field label="Time label"><Input value={form.timeLabel ?? ''} onChange={(e) => set('timeLabel', e.target.value)} placeholder="4:00-7:00 AM" /></Field>
      </div>
      {form.frequency === 'weekly' && (
        <Field label="Weekdays">
          <div className="flex gap-1.5 flex-wrap">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <button
                key={d} type="button"
                onClick={() => {
                  const cur = form.weekDays ?? [];
                  set('weekDays', cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${form.weekDays?.includes(i) ? 'bg-navy text-cream' : 'bg-ivory-dark text-navy-light/60'}`}
              >{d}</button>
            ))}
          </div>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numeric unit (optional)"><Input value={form.unit ?? ''} onChange={(e) => set('unit', e.target.value)} placeholder="MCQs, hours…" /></Field>
        <Field label="Target count"><Input type="number" value={form.targetCount ?? ''} onChange={(e) => set('targetCount', Number(e.target.value))} /></Field>
      </div>
      <Field label="Identity statement"><Input value={form.identityStatement} onChange={(e) => set('identityStatement', e.target.value)} placeholder='"I am someone who…"' /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cue"><Input value={form.cue} onChange={(e) => set('cue', e.target.value)} /></Field>
        <Field label="Reward"><Input value={form.reward} onChange={(e) => set('reward', e.target.value)} /></Field>
      </div>
      <Field label="2-minute version (for hard days)"><Input value={form.twoMinuteVersion} onChange={(e) => set('twoMinuteVersion', e.target.value)} /></Field>
      <Field label="Stack after (habit-stacking anchor)">
        <Select value={form.stackAfter ?? ''} onChange={(e) => set('stackAfter', e.target.value || undefined)}>
          <option value="">None</option>
          {allHabits.filter((h) => h.id !== form.id).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </Select>
      </Field>
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm font-bold text-navy"><input type="checkbox" checked={form.isKeystone} onChange={(e) => set('isKeystone', e.target.checked)} /> Keystone habit</label>
        <label className="flex items-center gap-2 text-sm font-bold text-navy"><input type="checkbox" checked={form.isNegative} onChange={(e) => set('isNegative', e.target.checked)} /> Negative / commitment</label>
      </div>
      <button onClick={() => onSave(form)} className="btn-gold w-full">Save Habit</button>
    </Modal>
  );
};
