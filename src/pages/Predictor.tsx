import React, { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Search, Info } from 'lucide-react';
import { ENGG_BRANCH_OPTIONS, AGRI_BRANCH_OPTIONS, PROF_BRANCH_OPTIONS } from '../data/kcet/branchOptions';
import { CATEGORY_OPTIONS, ENGG_ROUNDS, AGRI_ROUNDS, CourseType } from '../data/kcet/meta';
import { QuotaType, QUOTA_OPTIONS } from '../data/ayushCategoryLabels';
import { BAMS_CATEGORY_OPTIONS_BY_QUOTA, BAMS_ROUNDS } from '../data/bams/meta';
import { BHMS_CATEGORY_OPTIONS_BY_QUOTA, BHMS_ROUNDS } from '../data/bhms/meta';
import { BDS_CATEGORY_OPTIONS_BY_QUOTA, BDS_ROUNDS } from '../data/bds/meta';
import { MBBS_CATEGORY_OPTIONS_BY_QUOTA, MBBS_ROUNDS } from '../data/mbbs/meta';
import {
  predictEngg,
  predictAgri,
  predictProf,
  countPredictions,
  PredictionLevel,
  EnggResultRow,
  AgriResultRow,
  ProfResultRow,
} from '../lib/kcetPredictor';
import { predictBams, BamsResultRow } from '../lib/bamsPredictor';
import { predictBhms, BhmsResultRow } from '../lib/bhmsPredictor';
import { predictBds, BdsResultRow } from '../lib/bdsPredictor';
import { predictMbbs, MbbsResultRow } from '../lib/mbbsPredictor';
import { OverrideStore, subscribeOverrideStore } from '../lib/adminOverrides';

const BADGE_STYLES: Record<PredictionLevel, string> = {
  safe: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  moderate: 'bg-gold-100 text-gold-800 border-gold-200',
  borderline: 'bg-orange-100 text-orange-800 border-orange-200',
  longshot: 'bg-rose-100 text-rose-800 border-rose-200',
  unknown: 'bg-ink-100 text-ink-500 border-ink-200',
};

const BADGE_LABELS: Record<PredictionLevel, string> = {
  safe: 'Safe',
  moderate: 'Moderate',
  borderline: 'Borderline',
  longshot: 'Long Shot',
  unknown: 'No Data',
};

function Badge({ level }: { level: PredictionLevel }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${BADGE_STYLES[level]}`}>
      {BADGE_LABELS[level]}
    </span>
  );
}

function cellColor(rank: number, cutoff: number): string {
  if (!cutoff) return 'text-ink-300';
  if (rank < cutoff * 0.8) return 'text-emerald-700 font-semibold';
  if (rank < cutoff * 0.95) return 'text-gold-700 font-semibold';
  if (rank < cutoff * 1.2) return 'text-orange-700 font-semibold';
  return 'text-ink-400';
}

// AYUSH/medical predictors (bams, bhms, bds, mbbs) all share the same shape
// — NEET AIR + category only, no branch, a fixed set of real round-wise
// closing ranks with no future-year projection — so they're driven off one
// config table instead of repeating near-identical JSX per course.
type AyushCourse = 'bams' | 'bhms' | 'bds' | 'mbbs';
type AyushResultRow = BamsResultRow | BhmsResultRow | BdsResultRow | MbbsResultRow;

const AYUSH_CONFIG: Record<
  AyushCourse,
  {
    label: string;
    categoryOptionsByQuota: Record<QuotaType, { value: string; label: string }[]>;
    rounds: string[];
    predict: (rank: number, category: string, quota: QuotaType) => AyushResultRow[];
    note: React.ReactNode;
  }
> = {
  bams: {
    label: 'AYUSH (BAMS)',
    categoryOptionsByQuota: BAMS_CATEGORY_OPTIONS_BY_QUOTA,
    rounds: BAMS_ROUNDS,
    predict: predictBams,
    note: (
      <>
        These are the real <strong>2024 KEA AYUSH counselling</strong> closing ranks for <strong>BAMS</strong>,
        Rounds 1–3, across all four seat quotas. Only one year of data is available so far, so there's no
        future-year estimate here — always verify against the official KEA cutoff list before making a decision.
      </>
    ),
  },
  bhms: {
    label: 'AYUSH (BHMS)',
    categoryOptionsByQuota: BHMS_CATEGORY_OPTIONS_BY_QUOTA,
    rounds: BHMS_ROUNDS,
    predict: predictBhms,
    note: (
      <>
        These are the real <strong>2025 KEA AYUSH counselling</strong> closing ranks for <strong>BHMS</strong>, from
        the official Round 1 allotment cut-off report — the only round KEA had published in this aggregated form
        when this was built. Private/NRI/Management-Other BHMS seats hadn't been allotted yet in this report, so
        only Government shows results. Always verify against the official KEA cutoff list before making a decision.
      </>
    ),
  },
  bds: {
    label: 'BDS',
    categoryOptionsByQuota: BDS_CATEGORY_OPTIONS_BY_QUOTA,
    rounds: BDS_ROUNDS,
    predict: predictBds,
    note: (
      <>
        These are the real <strong>2025 KEA NEET-UG counselling</strong> closing ranks for <strong>BDS</strong>,
        computed from KEA's official Round 1 (final) and Round 3 seat allotment lists, across all four seat quotas
        — no Round 2 document was available. Always verify against the official KEA cutoff list before making a
        decision.
      </>
    ),
  },
  mbbs: {
    label: 'MBBS',
    categoryOptionsByQuota: MBBS_CATEGORY_OPTIONS_BY_QUOTA,
    rounds: MBBS_ROUNDS,
    predict: predictMbbs,
    note: (
      <>
        These are the real <strong>2025 KEA NEET-UG counselling</strong> closing ranks for <strong>MBBS</strong>,
        computed from KEA's official Round 3 (final, post-High-Court-order) seat allotment list, across all four
        seat quotas — Round 1 and Round 2 documents weren't available. Always verify against the official KEA
        cutoff list before making a decision.
      </>
    ),
  },
};
const AYUSH_COURSES = Object.keys(AYUSH_CONFIG) as AyushCourse[];
function isAyushCourse(t: CourseType): t is AyushCourse {
  return (AYUSH_COURSES as string[]).includes(t);
}

export default function Predictor() {
  const [courseType, setCourseType] = useState<CourseType>('engg');
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('');
  const [branch, setBranch] = useState('');
  const [quota, setQuota] = useState<QuotaType>('GOVT');
  const [submitted, setSubmitted] = useState(false);

  const branchOptions = courseType === 'engg' ? ENGG_BRANCH_OPTIONS : courseType === 'agri' ? AGRI_BRANCH_OPTIONS : PROF_BRANCH_OPTIONS;
  const isAyush = isAyushCourse(courseType);
  const categoryOptions = isAyush ? AYUSH_CONFIG[courseType].categoryOptionsByQuota[quota] : CATEGORY_OPTIONS;
  const needsBranch = !isAyush;

  const rankNum = parseFloat(rank);
  const valid = !!rankNum && rankNum > 0 && !!category && (!needsBranch || !!branch);

  const [overrides, setOverrides] = useState<OverrideStore>({ engg: {}, agri: {}, prof: {} });
  useEffect(() => subscribeOverrideStore(setOverrides), []);

  const enggRows = useMemo<EnggResultRow[]>(
    () => (submitted && valid && courseType === 'engg' ? predictEngg(rankNum, branch, category, overrides) : []),
    [submitted, valid, courseType, rankNum, branch, category, overrides]
  );
  const agriRows = useMemo<AgriResultRow[]>(
    () => (submitted && valid && courseType === 'agri' ? predictAgri(rankNum, branch, category, overrides) : []),
    [submitted, valid, courseType, rankNum, branch, category, overrides]
  );
  const profRows = useMemo<ProfResultRow[]>(
    () => (submitted && valid && courseType === 'prof' ? predictProf(rankNum, branch, category, overrides) : []),
    [submitted, valid, courseType, rankNum, branch, category, overrides]
  );
  const ayushRows = useMemo<AyushResultRow[]>(
    () => (submitted && valid && isAyush ? AYUSH_CONFIG[courseType].predict(rankNum, category, quota) : []),
    [submitted, valid, isAyush, courseType, rankNum, category, quota]
  );

  const rows = courseType === 'engg' ? enggRows : courseType === 'agri' ? agriRows : courseType === 'prof' ? profRows : ayushRows;
  const counts = countPredictions(rows);

  function handleTypeChange(t: CourseType) {
    setCourseType(t);
    setBranch('');
    setCategory('');
    setQuota('GOVT');
    setSubmitted(false);
  }

  function handleQuotaChange(q: QuotaType) {
    setQuota(q);
    setCategory('');
    setSubmitted(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSubmitted(true);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2 flex items-center justify-center gap-2">
          <GraduationCap className="w-7 h-7 text-gold-500" /> College Predictor
        </h1>
        <p className="text-ink-500 text-sm">KCET Engineering, Agriculture & Veterinary/Professional, plus Karnataka AYUSH (BAMS &amp; BHMS), MBBS and BDS counselling</p>
      </header>

      <div className="bg-white rounded-3xl border-2 border-ink-200 shadow-sm p-6 mb-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['engg', 'agri', 'prof', 'bams', 'bhms', 'mbbs', 'bds'] as CourseType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
                courseType === t ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
              }`}
            >
              {t === 'engg' ? 'Engineering' : t === 'agri' ? 'Agriculture' : t === 'prof' ? 'Veterinary / Professional' : isAyushCourse(t) ? AYUSH_CONFIG[t].label : t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">
              {courseType === 'prof' ? 'Your UGCET Rank' : isAyush ? 'Your NEET AIR (All India Rank)' : 'Your KCET Rank'}
            </label>
            <input
              type="number"
              min={1}
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 outline-none focus:border-gold-400"
            />
          </div>
          {isAyush && (
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">Seat Type</label>
              <select
                value={quota}
                onChange={(e) => handleQuotaChange(e.target.value as QuotaType)}
                className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 outline-none focus:border-gold-400 bg-white"
              >
                {QUOTA_OPTIONS.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 outline-none focus:border-gold-400 bg-white"
            >
              <option value="">-- Select --</option>
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
              {isAyush && categoryOptions.length === 0 && <option disabled>No seats allotted yet for this quota</option>}
            </select>
          </div>
          {needsBranch && (
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">
                {courseType === 'engg' ? 'Branch / Programme' : 'Course'}
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 outline-none focus:border-gold-400 bg-white"
              >
                <option value="">-- Select --</option>
                {branchOptions.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={!valid}
              className="w-full bg-gold-400 hover:bg-gold-300 disabled:opacity-40 disabled:cursor-not-allowed text-ink-900 font-bold py-2.5 rounded-2xl shadow flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Predict
            </button>
          </div>
        </form>
      </div>

      <div className="flex items-start gap-2 bg-sage-50 border border-sage-100 text-sage-800 text-xs rounded-3xl px-4 py-3 mb-8">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          {isAyush ? (
            AYUSH_CONFIG[courseType].note
          ) : (
            <>
              Columns for 2022–2024 are real published KEA cutoff ranks. <strong>2025 / 2026 columns are trend-based
              estimates</strong> (recency-weighted projection from the 2022–24 data) unless an admin has entered a real
              official figure — those are marked "Official". Always verify against the official KEA cutoff list before
              making a decision.
            </>
          )}
        </p>
      </div>

      {submitted && valid && rows.length === 0 && (
        <div className="bg-white rounded-3xl border-2 border-ink-200 p-8 text-center text-ink-500">
          No data found for this course / category combination. Try a different selection.
        </div>
      )}

      {submitted && valid && rows.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-ink-200 shadow-sm overflow-hidden">
          <div className="p-4 flex flex-wrap gap-3 border-b border-ink-100 text-sm">
            <span className="text-ink-500">
              Showing <strong>{rows.length}</strong> colleges
            </span>
            {counts.safe > 0 && <span className="text-emerald-700 font-semibold">✓ Safe: {counts.safe}</span>}
            {counts.moderate > 0 && <span className="text-gold-700 font-semibold">~ Moderate: {counts.moderate}</span>}
            {counts.borderline > 0 && <span className="text-orange-700 font-semibold">! Borderline: {counts.borderline}</span>}
            {counts.longshot + counts.unknown > 0 && (
              <span className="text-rose-700 font-semibold">✗ Long Shot: {counts.longshot + counts.unknown}</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">College</th>
                  <th className="text-left px-4 py-3">Location</th>
                  <th className="text-left px-4 py-3">Prediction</th>
                  {courseType === 'engg' &&
                    ENGG_ROUNDS.map((l) => (
                      <th key={l} className="text-right px-3 py-3 whitespace-nowrap">
                        {l}
                      </th>
                    ))}
                  {courseType === 'agri' &&
                    AGRI_ROUNDS.map((l) => (
                      <th key={l} className="text-right px-3 py-3 whitespace-nowrap">
                        {l}
                      </th>
                    ))}
                  {courseType === 'prof' && <th className="text-right px-3 py-3">Reference Cutoff</th>}
                  {isAyush &&
                    AYUSH_CONFIG[courseType].rounds.map((l) => (
                      <th key={l} className="text-right px-3 py-3 whitespace-nowrap">
                        {l}
                      </th>
                    ))}
                  {!isAyush && (
                    <>
                      <th className="text-right px-3 py-3 whitespace-nowrap">Est. 2025</th>
                      <th className="text-right px-3 py-3 whitespace-nowrap">Est. 2026</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {courseType === 'engg' &&
                  (rows as EnggResultRow[]).map((r, i) => (
                    <tr key={r.code} className="hover:bg-ink-50">
                      <td className="px-4 py-3 font-medium text-ink-800">
                        {i + 1}. {r.name}
                      </td>
                      <td className="px-4 py-3 text-ink-500">{r.location || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge level={r.prediction} />
                      </td>
                      {r.rounds.map((v, idx) => (
                        <td key={idx} className={`px-3 py-3 text-right whitespace-nowrap ${cellColor(rankNum, v)}`}>
                          {v ? v.toLocaleString() : '—'}
                        </td>
                      ))}
                      {r.projected.map((p) => (
                        <td key={p.year} className="px-3 py-3 text-right whitespace-nowrap">
                          <span className={p.source === 'official' ? 'text-emerald-700 font-bold' : 'text-ink-400 italic'}>
                            ~{p.value ? p.value.toLocaleString() : '—'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                {courseType === 'agri' &&
                  (rows as AgriResultRow[]).map((r, i) => (
                    <tr key={r.code} className="hover:bg-ink-50">
                      <td className="px-4 py-3 font-medium text-ink-800">
                        {i + 1}. {r.name}
                      </td>
                      <td className="px-4 py-3 text-ink-500">{r.location || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge level={r.prediction} />
                      </td>
                      {['2024_R1', '2024_R2'].map((rk) => (
                        <td key={rk} className={`px-3 py-3 text-right whitespace-nowrap ${cellColor(rankNum, r.values[rk])}`}>
                          {r.values[rk] ? r.values[rk].toLocaleString() : '—'}
                        </td>
                      ))}
                      {r.projected.map((p) => (
                        <td key={p.year} className="px-3 py-3 text-right whitespace-nowrap">
                          <span className={p.source === 'official' ? 'text-emerald-700 font-bold' : 'text-ink-400 italic'}>
                            ~{p.value ? p.value.toLocaleString() : '—'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                {courseType === 'prof' &&
                  (rows as ProfResultRow[]).map((r, i) => (
                    <tr key={r.code} className="hover:bg-ink-50">
                      <td className="px-4 py-3 font-medium text-ink-800">
                        {i + 1}. {r.name}
                      </td>
                      <td className="px-4 py-3 text-ink-500">{r.location || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge level={r.prediction} />
                      </td>
                      <td className={`px-3 py-3 text-right whitespace-nowrap ${cellColor(rankNum, r.cutoff)}`}>
                        {r.cutoff.toLocaleString()}
                      </td>
                      {r.projected.map((p) => (
                        <td key={p.year} className="px-3 py-3 text-right whitespace-nowrap">
                          <span className={p.source === 'official' ? 'text-emerald-700 font-bold' : 'text-ink-400 italic'}>
                            ~{p.value ? p.value.toLocaleString() : '—'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                {isAyush &&
                  (rows as AyushResultRow[]).map((r, i) => (
                    <tr key={r.code} className="hover:bg-ink-50">
                      <td className="px-4 py-3 font-medium text-ink-800">
                        {i + 1}. {r.name}
                      </td>
                      <td className="px-4 py-3 text-ink-500">{r.location || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge level={r.prediction} />
                      </td>
                      {r.rounds.map((v, idx) => (
                        <td key={idx} className={`px-3 py-3 text-right whitespace-nowrap ${cellColor(rankNum, v)}`}>
                          {v ? v.toLocaleString() : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
