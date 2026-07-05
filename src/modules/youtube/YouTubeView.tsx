import React, { useState } from 'react';
import { Plus, Trash2, Youtube as YoutubeIcon, ArrowRight } from 'lucide-react';
import { VideoIdea, VideoStage, ChannelMetricEntry, LaunchChecklistItem } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { uid, nowISO, todayISO } from '../../db';
import { PageHeader, Card, EmptyState, Pill } from '../../components/ui/Layout';
import { Modal } from '../../components/ui/Modal';
import { Field, Input, Select, TextArea } from '../../components/ui/Field';
import { LineChart } from '../../components/charts/LineChart';
import { SketchSprout } from '../../components/sketches/Sketches';

const STAGES: VideoStage[] = ['Idea', 'Script', 'Record', 'Edit', 'Thumbnail', 'Upload', 'Published'];

function blankIdea(): VideoIdea {
  return { id: uid(), title: '', topic: '', exam: 'NEET', stage: 'Idea', updatedAt: nowISO() };
}

export const YouTubeView: React.FC = () => {
  const { items: ideas, save: saveIdea, remove: removeIdea } = useCollection<VideoIdea>('videoIdeas');
  const { items: metrics, save: saveMetric } = useCollection<ChannelMetricEntry>('channelMetrics');
  const { items: checklist, save: saveChecklistItem } = useCollection<LaunchChecklistItem>('launchChecklist');
  const [editing, setEditing] = useState<VideoIdea | null>(null);
  const [metricOpen, setMetricOpen] = useState(false);

  const checklistDone = checklist.filter((c) => c.done).length;
  const subsTrend = metrics.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-8).map((m) => ({ label: m.date.slice(5), value: m.subscribers }));

  const moveStage = (idea: VideoIdea, dir: 1 | -1) => {
    const idx = STAGES.indexOf(idea.stage);
    const next = STAGES[Math.max(0, Math.min(STAGES.length - 1, idx + dir))];
    saveIdea({ ...idea, stage: next, publishedDate: next === 'Published' ? todayISO() : idea.publishedDate, updatedAt: nowISO() });
  };

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <PageHeader
        eyebrow="Science Monk Academy"
        title="YouTube Channel"
        subtitle='"Appa Deepo Bhava / Learn Explore Create" — launching end of July 2026.'
        right={<button onClick={() => setEditing(blankIdea())} className="btn-gold flex items-center gap-1.5 text-sm"><Plus className="w-4 h-4" />Idea</button>}
      />

      <Card className="mb-6 bg-navy-pale/40">
        <p className="text-xs text-navy-light/70 leading-relaxed">
          <b className="text-navy">Reality check:</b> new channels average ~15.5 months to 1,000 subscribers; weekly-posting
          educational channels can do it in 6–12 months. Indian regional CPMs are among the world's lowest, so the first
          6 months are an "investment phase" — watch time and consistency matter far more than early ad revenue.
          First-6-month goal: 1,000 subscribers + 4,000 watch hours (YPP eligibility), across ~20–50 videos.
        </p>
      </Card>

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Launch Checklist ({checklistDone}/{checklist.length})</h3>
      <Card className="!p-0 divide-y divide-gold-soft/60 mb-6">
        {checklist.map((c) => (
          <label key={c.id} className="flex items-center gap-3 p-3 cursor-pointer">
            <input type="checkbox" checked={c.done} onChange={(e) => saveChecklistItem({ ...c, done: e.target.checked })} />
            <span className={`text-sm flex-1 ${c.done ? 'line-through text-navy-light/40' : 'text-navy font-medium'}`}>{c.label}</span>
          </label>
        ))}
      </Card>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60">Subscriber Trend</h3>
        <button onClick={() => setMetricOpen(true)} className="text-[11px] font-bold text-gold uppercase">Log metrics</button>
      </div>
      <Card className="mb-6">
        {subsTrend.length ? <LineChart data={subsTrend} /> : <EmptyState icon={<YoutubeIcon className="w-10 h-10 text-gold" />} title="No metrics logged yet" />}
      </Card>

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Production Pipeline</h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
        {STAGES.map((stage) => (
          <div key={stage} className="min-w-[160px] shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-navy-light/50 mb-2 text-center">{stage}</p>
            <div className="space-y-2">
              {ideas.filter((i) => i.stage === stage).map((idea) => (
                <div key={idea.id} className="card !p-2.5 cursor-pointer" onClick={() => setEditing(idea)}>
                  <p className="text-xs font-bold text-navy leading-tight">{idea.title}</p>
                  <p className="text-[10px] text-navy-light/50 mt-0.5">{idea.exam}</p>
                  {stage !== 'Published' && (
                    <button onClick={(e) => { e.stopPropagation(); moveStage(idea, 1); }} className="text-[10px] text-gold font-bold flex items-center gap-0.5 mt-1">Next <ArrowRight className="w-3 h-3" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <IdeaEditorModal idea={editing} onClose={() => setEditing(null)} onSave={async (i) => { await saveIdea(i); setEditing(null); }} onDelete={async (id) => { await removeIdea(id); setEditing(null); }} />
      <MetricModal open={metricOpen} onClose={() => setMetricOpen(false)} onSave={async (m) => { await saveMetric(m); setMetricOpen(false); }} />
    </div>
  );
};

const IdeaEditorModal: React.FC<{ idea: VideoIdea | null; onClose: () => void; onSave: (i: VideoIdea) => void; onDelete: (id: string) => void }> = ({ idea, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState<VideoIdea | null>(idea);
  React.useEffect(() => setForm(idea), [idea]);
  if (!form) return null;
  const set = <K extends keyof VideoIdea>(k: K, v: VideoIdea[K]) => setForm({ ...form, [k]: v });
  return (
    <Modal open={!!idea} onClose={onClose} title="Video Idea">
      <Field label="Title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Topic"><Input value={form.topic} onChange={(e) => set('topic', e.target.value)} /></Field>
        <Field label="Exam"><Input value={form.exam} onChange={(e) => set('exam', e.target.value)} /></Field>
      </div>
      <Field label="Stage"><Select value={form.stage} onChange={(e) => set('stage', e.target.value as VideoStage)}>{STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
      <Field label="Planned date"><Input type="date" value={form.plannedDate ?? ''} onChange={(e) => set('plannedDate', e.target.value)} /></Field>
      <Field label="Notes"><TextArea rows={2} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
      <div className="flex gap-3">
        <button onClick={() => onSave({ ...form, updatedAt: nowISO() })} className="btn-gold flex-1">Save</button>
        {idea?.title && <button onClick={() => onDelete(form.id)} className="btn-outline"><Trash2 className="w-4 h-4" /></button>}
      </div>
    </Modal>
  );
};

const MetricModal: React.FC<{ open: boolean; onClose: () => void; onSave: (m: ChannelMetricEntry) => void }> = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({ subscribers: 0, views: 0, watchTimeHours: 0, avgViewDurationMin: 0, ctr: 0 });
  return (
    <Modal open={open} onClose={onClose} title="Log Channel Metrics">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Subscribers"><Input type="number" value={form.subscribers} onChange={(e) => setForm({ ...form, subscribers: Number(e.target.value) })} /></Field>
        <Field label="Views"><Input type="number" value={form.views} onChange={(e) => setForm({ ...form, views: Number(e.target.value) })} /></Field>
        <Field label="Watch time (hrs)"><Input type="number" value={form.watchTimeHours} onChange={(e) => setForm({ ...form, watchTimeHours: Number(e.target.value) })} /></Field>
        <Field label="Avg view duration (min)"><Input type="number" value={form.avgViewDurationMin} onChange={(e) => setForm({ ...form, avgViewDurationMin: Number(e.target.value) })} /></Field>
      </div>
      <Field label="CTR %"><Input type="number" value={form.ctr} onChange={(e) => setForm({ ...form, ctr: Number(e.target.value) })} /></Field>
      <button onClick={() => onSave({ id: uid(), date: todayISO(), ...form, updatedAt: nowISO() })} className="btn-gold w-full">Save Metrics</button>
    </Modal>
  );
};
