import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, GraduationCap, Lightbulb, FlaskConical, Landmark } from 'lucide-react';
import { SyllabusChapter, ChapterPlan, PlanExtraItem, ScientistStory } from '../../types';
import { uid, nowISO } from '../../db';
import { Modal } from '../../components/ui/Modal';
import { Field, Input, TextArea, Select } from '../../components/ui/Field';
import { ListEditor } from '../../components/ui/ListEditor';
import { Pill } from '../../components/ui/Layout';
import { SketchOwl, GoldDivider } from '../../components/sketches/Sketches';

const KIND_LABELS: Record<PlanExtraItem['kind'], string> = {
  analogy: 'Analogy', demo: 'Demo / Experiment', application: 'Real-world Application',
  mnemonic: 'Mnemonic / Memory Trick', misconception: 'Common Misconception', other: 'Other',
};

function blankPlan(chapterId: string): ChapterPlan {
  return {
    id: uid(), chapterId, coreConcept: '', learningObjectives: [], extras: [],
    scientistStories: [], miscNotes: [], status: 'not_started', updatedAt: nowISO(),
  };
}

export const ChapterPlanningModal: React.FC<{
  chapter: SyllabusChapter | null;
  plan?: ChapterPlan;
  onClose: () => void;
  onSave: (p: ChapterPlan) => void;
}> = ({ chapter, plan, onClose, onSave }) => {
  const [form, setForm] = useState<ChapterPlan | null>(null);

  useEffect(() => {
    if (chapter) setForm(plan ? { ...plan } : blankPlan(chapter.id));
  }, [chapter, plan]);

  if (!chapter || !form) return null;
  const set = <K extends keyof ChapterPlan>(k: K, v: ChapterPlan[K]) => setForm({ ...form, [k]: v });

  const moveObjective = (i: number, dir: -1 | 1) => {
    const arr = [...form.learningObjectives];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set('learningObjectives', arr);
  };

  return (
    <Modal open={!!chapter} onClose={onClose} title="Chapter Planning" wide>
      <div className="flex items-start gap-4 mb-2">
        <SketchOwl size={56} className="shrink-0" />
        <div>
          <p className="font-bold text-navy font-display text-lg leading-tight">{chapter.title}</p>
          <p className="text-xs text-navy-light/50">Teaching prep notebook — plan, extras, stories, misc for this topic.</p>
        </div>
      </div>
      <GoldDivider className="my-4" />

      <Field label="Core concept — what is this chapter fundamentally about?">
        <TextArea rows={2} value={form.coreConcept} onChange={(e) => set('coreConcept', e.target.value)} placeholder="One or two sentences on the central idea students must walk away understanding…" />
      </Field>

      <Field label="Teaching sequence / lesson plan outline" hint="Order matters — this is the order you'll actually teach it in.">
        <div className="space-y-1.5">
          {form.learningObjectives.map((obj, i) => (
            <div key={i} className="flex items-center gap-2 bg-ivory-dark/50 rounded-xl px-3 py-2">
              <span className="text-xs font-bold text-gold w-4">{i + 1}.</span>
              <span className="flex-1 text-sm text-navy">{obj}</span>
              <button onClick={() => moveObjective(i, -1)} className="text-navy-light/40 hover:text-navy"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => moveObjective(i, 1)} className="text-navy-light/40 hover:text-navy"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button onClick={() => set('learningObjectives', form.learningObjectives.filter((_, j) => j !== i))} className="text-navy-light/40 hover:text-amber-flag"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <ListEditor items={[]} onChange={(items) => items[0] && set('learningObjectives', [...form.learningObjectives, items[0]])} placeholder="Add a teaching step…" bullet="→" />
      </Field>

      <GoldDivider className="my-5" />
      <ExtrasEditor items={form.extras} onChange={(extras) => set('extras', extras)} />

      <GoldDivider className="my-5" />
      <ScientistStoriesEditor items={form.scientistStories} onChange={(s) => set('scientistStories', s)} />

      <GoldDivider className="my-5" />
      <Field label="Misc notes — anything else useful for this topic">
        <ListEditor items={form.miscNotes} onChange={(v) => set('miscNotes', v)} placeholder="Add a note…" />
      </Field>

      <Field label="Prep status">
        <Select value={form.status} onChange={(e) => set('status', e.target.value as ChapterPlan['status'])}>
          <option value="not_started">Not started</option>
          <option value="drafted">Drafted</option>
          <option value="ready">Ready to teach</option>
          <option value="delivered">Delivered in class</option>
        </Select>
      </Field>

      <button onClick={() => onSave({ ...form, updatedAt: nowISO() })} className="btn-gold w-full mt-2">Save Chapter Plan</button>
    </Modal>
  );
};

const KIND_ICONS: Record<PlanExtraItem['kind'], React.ReactNode> = {
  analogy: <Lightbulb className="w-3.5 h-3.5" />, demo: <FlaskConical className="w-3.5 h-3.5" />,
  application: <Landmark className="w-3.5 h-3.5" />, mnemonic: <GraduationCap className="w-3.5 h-3.5" />,
  misconception: <Trash2 className="w-3.5 h-3.5" />, other: <Plus className="w-3.5 h-3.5" />,
};

const ExtrasEditor: React.FC<{ items: PlanExtraItem[]; onChange: (items: PlanExtraItem[]) => void }> = ({ items, onChange }) => {
  const [kind, setKind] = useState<PlanExtraItem['kind']>('analogy');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');

  const add = () => {
    if (!title.trim()) return;
    onChange([...items, { id: uid(), kind, title: title.trim(), detail: detail.trim() }]);
    setTitle(''); setDetail('');
  };

  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-wider text-navy-light/60 mb-1.5 block">
        Extras — analogies, demos, applications, mnemonics, misconceptions
      </span>
      <div className="space-y-2 mb-3">
        {items.map((item) => (
          <div key={item.id} className="bg-ivory-dark/50 rounded-xl p-3 flex items-start gap-3">
            <span className="icon-chip shrink-0">{KIND_ICONS[item.kind]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-sm text-navy">{item.title}</p>
                <Pill tone="ghost" className="!text-[9px] !py-0.5">{KIND_LABELS[item.kind]}</Pill>
              </div>
              {item.detail && <p className="text-xs text-navy-light/70">{item.detail}</p>}
            </div>
            <button onClick={() => onChange(items.filter((i) => i.id !== item.id))} className="text-navy-light/30 hover:text-amber-flag shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="bg-cream border border-gold-soft rounded-xl p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Select value={kind} onChange={(e) => setKind(e.target.value as PlanExtraItem['kind'])} className="text-xs !py-1.5">
            {(Object.keys(KIND_LABELS) as PlanExtraItem['kind'][]).map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
          </Select>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" className="text-xs !py-1.5" />
        </div>
        <TextArea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Detail — how to use it in class" rows={2} className="text-xs" />
        <button onClick={add} className="btn-outline w-full !py-1.5 text-xs flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" />Add extra</button>
      </div>
    </div>
  );
};

const ScientistStoriesEditor: React.FC<{ items: ScientistStory[]; onChange: (items: ScientistStory[]) => void }> = ({ items, onChange }) => {
  const [scientist, setScientist] = useState('');
  const [story, setStory] = useState('');
  const [relevance, setRelevance] = useState('');

  const add = () => {
    if (!scientist.trim() || !story.trim()) return;
    onChange([...items, { id: uid(), scientist: scientist.trim(), story: story.trim(), relevance: relevance.trim() }]);
    setScientist(''); setStory(''); setRelevance('');
  };

  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-wider text-navy-light/60 mb-1.5 block">Scientist stories for this topic</span>
      <div className="space-y-2 mb-3">
        {items.map((s) => (
          <div key={s.id} className="bg-ivory-dark/50 rounded-xl p-3 flex items-start gap-3">
            <span className="icon-chip shrink-0"><GraduationCap className="w-3.5 h-3.5" /></span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-navy">{s.scientist}</p>
              <p className="text-xs text-navy-light/70 mt-0.5">{s.story}</p>
              {s.relevance && <p className="text-xs text-gold font-medium mt-1 italic">Why it fits: {s.relevance}</p>}
            </div>
            <button onClick={() => onChange(items.filter((i) => i.id !== s.id))} className="text-navy-light/30 hover:text-amber-flag shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="bg-cream border border-gold-soft rounded-xl p-3 space-y-2">
        <Input value={scientist} onChange={(e) => setScientist(e.target.value)} placeholder="Scientist name" className="text-xs !py-1.5" />
        <TextArea value={story} onChange={(e) => setStory(e.target.value)} placeholder="The story" rows={2} className="text-xs" />
        <Input value={relevance} onChange={(e) => setRelevance(e.target.value)} placeholder="Why it fits this topic" className="text-xs !py-1.5" />
        <button onClick={add} className="btn-outline w-full !py-1.5 text-xs flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" />Add story</button>
      </div>
    </div>
  );
};
