import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, RefreshCw, Star } from 'lucide-react';
import { Target, TargetPeriod, WeeklyReviewEntry } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { uid, nowISO, todayISO } from '../../db';
import { weekKeyFor, monthKeyFor, addDays } from '../../utils/dates';
import { PageHeader, Card, EmptyState } from '../../components/ui/Layout';
import { Modal } from '../../components/ui/Modal';
import { Field, Input } from '../../components/ui/Field';
import { BarChart } from '../../components/charts/BarChart';
import { ListEditor } from '../../components/ui/ListEditor';
import { SketchMountainFlag } from '../../components/sketches/Sketches';

function blank(period: TargetPeriod, periodKey: string): Target {
  return { id: uid(), period, periodKey, objective: '', metric: '', targetValue: 0, achievedValue: 0, unit: '', updatedAt: nowISO() };
}

export const TargetsView: React.FC = () => {
  const { items: targets, save, remove } = useCollection<Target>('targets');
  const { items: reviews, save: saveReview } = useCollection<WeeklyReviewEntry>('weeklyReviews');
  const [period, setPeriod] = useState<TargetPeriod>('weekly');
  const [anchor, setAnchor] = useState(todayISO());
  const [editing, setEditing] = useState<Target | null>(null);

  const periodKey = period === 'weekly' ? weekKeyFor(anchor) : monthKeyFor(anchor);
  const list = targets.filter((t) => t.period === period && t.periodKey === periodKey);
  const review = reviews.find((r) => r.weekKey === weekKeyFor(anchor)) ?? {
    id: uid(), weekKey: weekKeyFor(anchor), wins: [], challenges: [], changesToMake: [], gratitude: [], topThreeNextWeek: [], rating: 0, updatedAt: nowISO(),
  };

  const rollover = (t: Target) => {
    const nextKey = period === 'weekly' ? addDays(periodKey, 7) : monthKeyFor(addDays(`${periodKey}-15`, 30));
    save({ ...blank(period, nextKey), objective: t.objective, metric: t.metric, unit: t.unit, targetValue: Math.max(0, t.targetValue - t.achievedValue), rolledOverFrom: t.id });
  };

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <PageHeader
        eyebrow="Goals"
        title="Weekly & Monthly Targets"
        subtitle="SMART + OKR-style targets, with a GTD-style weekly review ritual."
        right={<button onClick={() => setEditing(blank(period, periodKey))} className="btn-gold flex items-center gap-1.5 text-sm"><Plus className="w-4 h-4" />Target</button>}
      />

      <div className="flex gap-1 bg-ivory-dark rounded-full p-1 mb-4 w-fit mx-auto">
        {(['weekly', 'monthly'] as TargetPeriod[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize ${period === p ? 'bg-navy text-cream' : 'text-navy-light/60'}`}>{p}</button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => setAnchor(addDays(anchor, period === 'weekly' ? -7 : -30))} className="p-2 rounded-full hover:bg-gold-pale text-navy-light"><ChevronLeft className="w-5 h-5" /></button>
        <p className="font-bold text-navy text-sm">{periodKey}</p>
        <button onClick={() => setAnchor(addDays(anchor, period === 'weekly' ? 7 : 30))} className="p-2 rounded-full hover:bg-gold-pale text-navy-light"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {list.length ? (
        <>
          <Card className="mb-6"><BarChart data={list.map((t) => ({ label: t.objective.slice(0, 10), value: t.achievedValue, target: t.targetValue }))} formatValue={(v) => String(Math.round(v))} /></Card>
          <Card className="!p-0 divide-y divide-gold-soft/60 mb-8">
            {list.map((t) => (
              <div key={t.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm text-navy">{t.objective}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditing(t)} className="text-[11px] font-bold text-gold uppercase">Edit</button>
                    {t.achievedValue < t.targetValue && <button onClick={() => rollover(t)} title="Roll incomplete into next period" className="text-navy-light/40 hover:text-navy"><RefreshCw className="w-3.5 h-3.5" /></button>}
                    <button onClick={() => remove(t.id)} className="text-navy-light/30 hover:text-amber-flag"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-xs text-navy-light/50 mb-1.5">{t.metric}</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-ivory-dark rounded-full overflow-hidden flex-1"><div className="h-full bg-gold" style={{ width: `${Math.min(100, (t.achievedValue / (t.targetValue || 1)) * 100)}%` }} /></div>
                  <span className="text-xs font-bold text-navy-light/60 shrink-0">{t.achievedValue}/{t.targetValue} {t.unit}</span>
                </div>
              </div>
            ))}
          </Card>
        </>
      ) : (
        <EmptyState icon={<SketchMountainFlag size={72} />} title={`No ${period} targets yet`} hint="Set an objective and a measurable key result." />
      )}

      {period === 'weekly' && (
        <>
          <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">GTD-Style Weekly Review (20-45 min, Sundays)</h3>
          <Card className="space-y-5">
            <ReviewList label="Biggest wins" items={review.wins} onChange={(v) => saveReview({ ...review, wins: v })} />
            <ReviewList label="Challenges & lessons" items={review.challenges} onChange={(v) => saveReview({ ...review, challenges: v })} />
            <ReviewList label="What to change next week" items={review.changesToMake} onChange={(v) => saveReview({ ...review, changesToMake: v })} />
            <ReviewList label="Grateful for" items={review.gratitude} onChange={(v) => saveReview({ ...review, gratitude: v })} />
            <ReviewList label="Top 3 for next week" items={review.topThreeNextWeek} onChange={(v) => saveReview({ ...review, topThreeNextWeek: v })} />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-navy-light/60 mb-1.5 block">Overall week rating</span>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button key={i} onClick={() => saveReview({ ...review, rating: i + 1 })}>
                    <Star className={`w-5 h-5 ${review.rating >= i + 1 ? 'fill-gold text-gold' : 'text-navy-light/20'}`} />
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}

      <TargetEditorModal target={editing} onClose={() => setEditing(null)} onSave={async (t) => { await save(t); setEditing(null); }} />
    </div>
  );
};

const ReviewList: React.FC<{ label: string; items: string[]; onChange: (v: string[]) => void }> = ({ label, items, onChange }) => (
  <div>
    <span className="text-xs font-bold uppercase tracking-wider text-navy-light/60 mb-1.5 block">{label}</span>
    <ListEditor items={items} onChange={onChange} />
  </div>
);

const TargetEditorModal: React.FC<{ target: Target | null; onClose: () => void; onSave: (t: Target) => void }> = ({ target, onClose, onSave }) => {
  const [form, setForm] = useState<Target | null>(target);
  React.useEffect(() => setForm(target), [target]);
  if (!form) return null;
  const set = <K extends keyof Target>(k: K, v: Target[K]) => setForm({ ...form, [k]: v });
  return (
    <Modal open={!!target} onClose={onClose} title="Target">
      <Field label="Objective"><Input value={form.objective} onChange={(e) => set('objective', e.target.value)} placeholder="e.g. Solve 700 MCQs" /></Field>
      <Field label="Metric / key result"><Input value={form.metric} onChange={(e) => set('metric', e.target.value)} placeholder="e.g. MCQs solved across all tracks" /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Target"><Input type="number" value={form.targetValue} onChange={(e) => set('targetValue', Number(e.target.value))} /></Field>
        <Field label="Achieved"><Input type="number" value={form.achievedValue} onChange={(e) => set('achievedValue', Number(e.target.value))} /></Field>
        <Field label="Unit"><Input value={form.unit} onChange={(e) => set('unit', e.target.value)} /></Field>
      </div>
      <button onClick={() => onSave({ ...form, updatedAt: nowISO() })} className="btn-gold w-full">Save Target</button>
    </Modal>
  );
};
