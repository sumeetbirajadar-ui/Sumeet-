import React, { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Search, Info } from 'lucide-react';
import { ENGG_BRANCH_OPTIONS, AGRI_BRANCH_OPTIONS, PROF_BRANCH_OPTIONS } from '../data/kcet/branchOptions';
import { CATEGORY_OPTIONS, ENGG_ROUNDS, AGRI_ROUNDS, CourseType } from '../data/kcet/meta';
import { BAMS_CATEGORY_OPTIONS, BAMS_ROUNDS } from '../data/bams/meta';
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

export default function Predictor() {
  const [courseType, setCourseType] = useState<CourseType>('engg');
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('');
  const [branch, setBranch] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const branchOptions = courseType === 'engg' ? ENGG_BRANCH_OPTIONS : courseType === 'agri' ? AGRI_BRANCH_OPTIONS : PROF_BRANCH_OPTIONS;
  const categoryOptions = courseType === 'bams' ? BAMS_CATEGORY_OPTIONS : CATEGORY_OPTIONS;
  const needsBranch = courseType !== 'bams';

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
  const bamsRows = useMemo<BamsResultRow[]>(
    () => (submitted && valid && courseType === 'bams' ? predictBams(rankNum, category) : []),
    [submitted, valid, courseType, rankNum, category]
  );

  const rows = courseType === 'engg' ? enggRows : courseType === 'agri' ? agriRows : courseType === 'prof' ? profRows : bamsRows;
  const counts = countPredictions(rows);

  function handleTypeChange(t: CourseType) {
    setCourseType(t);
    setBranch('');
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
        <p className="text-ink-500 text-sm">KCET Engineering, Agriculture & Veterinary/Professional, plus Karnataka AYUSH (BAMS) counselling</p>
      </header>

      <div className="bg-white rounded-3xl border-2 border-ink-200 shadow-sm p-6 mb-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['engg', 'agri', 'prof', 'bams'] as CourseType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
                courseType === t ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
              }`}
            >
              {t === 'engg' ? 'Engineering' : t === 'agri' ? 'Agriculture' : t === 'prof' ? 'Veterinary / Professional' : 'AYUSH (BAMS)'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={`grid grid-cols-1 gap-4 items-end ${needsBranch ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-1 block">
              {courseType === 'prof' ? 'Your UGCET Rank' : courseType === 'bams' ? 'Your NEET AIR (All India Rank)' : 'Your KCET Rank'}
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

      {courseType !== 'bams' ? (
        <div className="flex items-start gap-2 bg-sage-50 border border-sage-100 text-sage-800 text-xs rounded-3xl px-4 py-3 mb-8">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Columns for 2022–2024 are real published KEA cutoff ranks. <strong>2025 / 2026 columns are trend-based
            estimates</strong> (recency-weighted projection from the 2022–24 data) unless an admin has entered a real
            official figure — those are marked "Official". Always verify against the official KEA cutoff list before
            making a decision.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 bg-sage-50 border border-sage-100 text-sage-800 text-xs rounded-3xl px-4 py-3 mb-8">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            These are the real <strong>2024 KEA AYUSH counselling</strong> closing ranks for <strong>government-quota
            BAMS seats only</strong> (private/NRI/management-quota seats aren't included yet). Only one year of data
            is available so far, so there's no future-year estimate here — always verify against the official KEA
            cutoff list before making a decision. MBBS, BDS and BHMS predictors aren't available yet — the category-
            wise official data for those couldn't be fully sourced yet.
          </p>
        </div>
      )}

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
                  {courseType === 'bams' &&
                    BAMS_ROUNDS.map((l) => (
                      <th key={l} className="text-right px-3 py-3 whitespace-nowrap">
                        {l}
                      </th>
                    ))}
                  {courseType !== 'bams' && (
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
                {courseType === 'bams' &&
                  (rows as BamsResultRow[]).map((r, i) => (
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
