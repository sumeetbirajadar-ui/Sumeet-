import React, { useState } from 'react';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { BucketItem, BucketCategory, BucketStatus } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { uid, nowISO, todayISO } from '../../db';
import { PageHeader, Card, EmptyState, Pill } from '../../components/ui/Layout';
import { Modal } from '../../components/ui/Modal';
import { Field, Input, Select, TextArea } from '../../components/ui/Field';
import { ProgressRing } from '../../components/charts/ProgressRing';
import { SketchCompass } from '../../components/sketches/Sketches';

const CATEGORIES: BucketCategory[] = ['Travel', 'Career', 'Financial', 'Spiritual', 'Family', 'Learning', 'Health', 'Experiences'];

function blank(): BucketItem {
  return { id: uid(), title: '', category: 'Experiences', status: 'not_started', milestones: [], updatedAt: nowISO() };
}

export const BucketListView: React.FC = () => {
  const { items, save, remove } = useCollection<BucketItem>('bucketItems');
  const [filter, setFilter] = useState<BucketCategory | 'All'>('All');
  const [editing, setEditing] = useState<BucketItem | null>(null);
  const [showAchieved, setShowAchieved] = useState(false);

  const filtered = items.filter((i) => (filter === 'All' || i.category === filter) && (showAchieved ? i.status === 'achieved' : i.status !== 'achieved'));
  const achievedPct = items.length ? Math.round((items.filter((i) => i.status === 'achieved').length / items.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <PageHeader
        eyebrow="Life Goals"
        title="Bucket List"
        subtitle="Travel, career, financial, spiritual, family, learning, health, experiences."
        right={<button onClick={() => setEditing(blank())} className="btn-gold flex items-center gap-1.5 text-sm"><Plus className="w-4 h-4" />Item</button>}
      />

      <Card className="flex items-center gap-6 mb-6">
        <ProgressRing percent={achievedPct} sublabel="Achieved" />
        <p className="text-sm text-navy-light/70 flex-1">{items.filter((i) => i.status === 'achieved').length} of {items.length} life goals achieved so far.</p>
      </Card>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin mb-4 pb-1">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${filter === c ? 'bg-navy text-cream' : 'bg-ivory-dark text-navy-light/60'}`}>{c}</button>
        ))}
      </div>
      <div className="flex gap-1 bg-ivory-dark rounded-full p-1 mb-4 w-fit">
        {[['active', false], ['achieved', true]].map(([label, val]) => (
          <button key={label as string} onClick={() => setShowAchieved(val as boolean)} className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize ${showAchieved === val ? 'bg-navy text-cream' : 'text-navy-light/60'}`}>{label as string}</button>
        ))}
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((item) => {
            const doneMilestones = item.milestones.filter((m) => m.done).length;
            return (
              <Card key={item.id} className="cursor-pointer" >
                <div className="flex items-start justify-between" onClick={() => setEditing(item)}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-navy">{item.title}</p>
                      {item.status === 'achieved' && <Trophy className="w-4 h-4 text-gold" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone="ghost">{item.category}</Pill>
                      {item.targetDate && <span className="text-xs text-navy-light/50">by {item.targetDate}</span>}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }} className="text-navy-light/30 hover:text-amber-flag"><Trash2 className="w-4 h-4" /></button>
                </div>
                {item.milestones.length > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-ivory-dark rounded-full overflow-hidden"><div className="h-full bg-gold" style={{ width: `${(doneMilestones / item.milestones.length) * 100}%` }} /></div>
                    <p className="text-[11px] text-navy-light/50 mt-1">{doneMilestones}/{item.milestones.length} milestones</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<SketchCompass size={72} />} title="Nothing here yet" hint="Add a life goal and break it into milestones." />
      )}

      <BucketEditorModal item={editing} onClose={() => setEditing(null)} onSave={async (i) => { await save(i); setEditing(null); }} />
    </div>
  );
};

const BucketEditorModal: React.FC<{ item: BucketItem | null; onClose: () => void; onSave: (i: BucketItem) => void }> = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState<BucketItem | null>(item);
  const [milestoneDraft, setMilestoneDraft] = useState('');
  React.useEffect(() => setForm(item), [item]);
  if (!form) return null;
  const set = <K extends keyof BucketItem>(k: K, v: BucketItem[K]) => setForm({ ...form, [k]: v });

  return (
    <Modal open={!!item} onClose={onClose} title="Bucket List Item">
      <Field label="Title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category"><Select value={form.category} onChange={(e) => set('category', e.target.value as BucketCategory)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        <Field label="Target date"><Input type="date" value={form.targetDate ?? ''} onChange={(e) => set('targetDate', e.target.value)} /></Field>
      </div>
      <Field label="Status">
        <Select value={form.status} onChange={(e) => set('status', e.target.value as BucketStatus)}>
          <option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="achieved">Achieved</option>
        </Select>
      </Field>
      <Field label="Why it matters"><TextArea rows={2} value={form.whyItMatters ?? ''} onChange={(e) => set('whyItMatters', e.target.value)} /></Field>
      <Field label="Milestones">
        <div className="space-y-1.5 mb-2">
          {form.milestones.map((m, i) => (
            <div key={m.id} className="flex items-center gap-2">
              <input type="checkbox" checked={m.done} onChange={(e) => { const ms = [...form.milestones]; ms[i] = { ...m, done: e.target.checked }; set('milestones', ms); }} />
              <span className={`flex-1 text-sm ${m.done ? 'line-through text-navy-light/40' : 'text-navy'}`}>{m.text}</span>
              <button onClick={() => set('milestones', form.milestones.filter((x) => x.id !== m.id))}><Trash2 className="w-3.5 h-3.5 text-navy-light/30" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={milestoneDraft} onChange={(e) => setMilestoneDraft(e.target.value)} placeholder="Add a milestone…" className="text-sm flex-1" />
          <button onClick={() => { if (!milestoneDraft.trim()) return; set('milestones', [...form.milestones, { id: uid(), text: milestoneDraft.trim(), done: false }]); setMilestoneDraft(''); }} className="icon-chip"><Plus className="w-4 h-4" /></button>
        </div>
      </Field>
      <button onClick={() => onSave({ ...form, updatedAt: nowISO(), achievedAt: form.status === 'achieved' ? (form.achievedAt ?? todayISO()) : undefined })} className="btn-gold w-full mt-2">Save</button>
    </Modal>
  );
};
