import React, { useMemo, useState } from 'react';
import { NotebookPen, Star, ChevronDown } from 'lucide-react';
import { SyllabusChapter, ExamTrack, ChapterPlan } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { TRACK_LABELS } from '../../db/seedSyllabus';
import { uid, nowISO } from '../../db';
import { PageHeader, Card, Pill } from '../../components/ui/Layout';
import { ProgressRing } from '../../components/charts/ProgressRing';
import { Heatmap } from '../../components/charts/Heatmap';
import { ChapterPlanningModal } from './ChapterPlanning';

const TRACKS: ExamTrack[] = ['NEET', 'KCET', 'JEE_MAIN', 'JEE_ADVANCED', 'CENGAGE'];

export const SyllabusView: React.FC = () => {
  const { items: chapters, save: saveChapter } = useCollection<SyllabusChapter>('syllabusChapters');
  const { items: plans, save: savePlan } = useCollection<ChapterPlan>('chapterPlans');
  const [track, setTrack] = useState<ExamTrack>('NEET');
  const [planChapter, setPlanChapter] = useState<SyllabusChapter | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const trackChapters = chapters.filter((c) => c.track === track).sort((a, b) => a.order - b.order);
  const overallPct = trackChapters.length
    ? Math.round(trackChapters.reduce((s, c) => s + c.completionPct, 0) / trackChapters.length) : 0;

  const grouped = useMemo(() => {
    if (track !== 'CENGAGE') return new Map([['', trackChapters]]);
    const g = new Map<string, SyllabusChapter[]>();
    trackChapters.forEach((c) => {
      const key = c.volume ?? '';
      if (!g.has(key)) g.set(key, []);
      g.get(key)!.push(c);
    });
    return g;
  }, [trackChapters, track]);

  const heatmapCells = trackChapters.map((c, i) => ({
    date: new Date(2024, 0, i + 1).toISOString().split('T')[0], value: c.completionPct / 100,
  }));

  const planFor = (chapterId: string) => plans.find((p) => p.chapterId === chapterId);

  const update = (chapter: SyllabusChapter, patch: Partial<SyllabusChapter>) => saveChapter({ ...chapter, ...patch });

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <PageHeader
        eyebrow="Self-Study"
        title="Syllabus Tracker"
        subtitle="NEET · KCET · JEE Main · JEE Advanced · Cengage — with per-chapter teaching prep."
      />

      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin mb-6 pb-1">
        {TRACKS.map((t) => (
          <button
            key={t}
            onClick={() => setTrack(t)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${track === t ? 'bg-navy text-cream' : 'bg-ivory-dark text-navy-light/60'}`}
          >{TRACK_LABELS[t]}</button>
        ))}
      </div>

      <Card className="flex items-center gap-6 mb-6">
        <ProgressRing percent={overallPct} sublabel="Complete" />
        <div className="flex-1">
          <p className="font-bold text-navy text-sm mb-1">{TRACK_LABELS[track]}</p>
          <p className="text-xs text-navy-light/60 mb-3">{trackChapters.length} chapters</p>
          <Heatmap cells={heatmapCells} weeks={Math.ceil(trackChapters.length / 7) || 1} endDate={heatmapCells.slice(-1)[0]?.date} />
        </div>
      </Card>

      {[...grouped.entries()].map(([volume, chs]) => (
        <div key={volume} className="mb-6">
          {volume && <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">{volume}</h3>}
          <Card className="!p-0 divide-y divide-gold-soft/60">
            {chs.map((c) => {
              const plan = planFor(c.id);
              const isOpen = expandedId === c.id;
              return (
                <div key={c.id} className="p-4">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : c.id)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-navy truncate">{c.title}</p>
                      <div className="h-1.5 bg-ivory-dark rounded-full overflow-hidden mt-1.5 w-full max-w-xs">
                        <div className="h-full bg-gold" style={{ width: `${c.completionPct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-navy-light/60 shrink-0">{c.completionPct}%</span>
                    {plan && plan.status !== 'not_started' && <Pill tone="navy" className="!text-[9px] shrink-0">Planned</Pill>}
                    <button
                      onClick={(e) => { e.stopPropagation(); setPlanChapter(c); }}
                      className="icon-chip hover:bg-gold hover:text-cream transition-colors shrink-0"
                      title="Chapter planning: teaching prep, extras, scientist stories"
                    ><NotebookPen className="w-4 h-4" /></button>
                    <ChevronDown className={`w-4 h-4 text-navy-light/40 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isOpen && (
                    <div className="mt-4 pl-1 grid grid-cols-2 gap-3 text-xs">
                      <label className="col-span-2">
                        <span className="font-bold text-navy-light/50 block mb-1">Completion %</span>
                        <input type="range" min={0} max={100} value={c.completionPct} onChange={(e) => update(c, { completionPct: Number(e.target.value) })} className="w-full accent-[#C9A227]" />
                      </label>
                      <label>
                        <span className="font-bold text-navy-light/50 block mb-1">Target date</span>
                        <input type="date" value={c.targetDate ?? ''} onChange={(e) => update(c, { targetDate: e.target.value })} className="input-field !py-1" />
                      </label>
                      <label>
                        <span className="font-bold text-navy-light/50 block mb-1">MCQs practiced</span>
                        <input type="number" value={c.mcqCount} onChange={(e) => update(c, { mcqCount: Number(e.target.value) })} className="input-field !py-1" />
                      </label>
                      <div className="col-span-2 flex gap-4">
                        {(['r1Done', 'r2Done', 'r3Done'] as const).map((r, i) => (
                          <label key={r} className="flex items-center gap-1.5">
                            <input type="checkbox" checked={!!c[r]} onChange={(e) => update(c, { [r]: e.target.checked ? new Date().toISOString().split('T')[0] : undefined })} />
                            <span className="font-bold text-navy-light/60">R{i + 1}</span>
                          </label>
                        ))}
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <span className="font-bold text-navy-light/50 mr-1">Confidence</span>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => update(c, { confidence: s })}>
                            <Star className={`w-4 h-4 ${c.confidence >= s ? 'fill-gold text-gold' : 'text-navy-light/20'}`} />
                          </button>
                        ))}
                      </div>
                      <label className="col-span-2">
                        <span className="font-bold text-navy-light/50 block mb-1">Notes</span>
                        <textarea value={c.notes ?? ''} onChange={(e) => update(c, { notes: e.target.value })} className="input-field resize-none" rows={2} />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      ))}

      <ChapterPlanningModal
        chapter={planChapter}
        plan={planChapter ? planFor(planChapter.id) : undefined}
        onClose={() => setPlanChapter(null)}
        onSave={async (p) => { await savePlan(p); setPlanChapter(null); }}
      />
    </div>
  );
};
