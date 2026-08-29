import { ENGG, AGRI, PROF } from '../data/kcet';
import { ENGG_ROUNDS, FINAL_IDX, AGRI_ROUNDS, AGRI_ROUND_KEYS, CourseType } from '../data/kcet/meta';
import { OverrideStore, getOverrideFrom } from './adminOverrides';

export type PredictionLevel = 'safe' | 'moderate' | 'borderline' | 'longshot' | 'unknown';

export function getPrediction(rank: number, refVal: number): PredictionLevel {
  if (!refVal || refVal <= 0) return 'unknown';
  if (rank < refVal * 0.8) return 'safe';
  if (rank < refVal * 0.95) return 'moderate';
  if (rank < refVal * 1.2) return 'borderline';
  return 'longshot';
}

const PREDICTION_ORDER: Record<PredictionLevel, number> = {
  safe: 0,
  moderate: 1,
  borderline: 2,
  longshot: 3,
  unknown: 4,
};

function trendEstimate(values: number[], weights: number[]): number {
  let wsum = 0;
  let total = 0;
  values.forEach((v, i) => {
    if (v && v > 0) {
      wsum += v * weights[i];
      total += weights[i];
    }
  });
  return total > 0 ? Math.round(wsum / total) : 0;
}

/**
 * Projects `yearsAhead` further cutoffs from a sequence of real final-round
 * values (oldest first), using the same recency-weighted average the source
 * predictor used for its single "Est. 2025" column. This is a trend
 * projection, not official KEA data — callers must label it as an estimate.
 */
export function estimateFutureYears(finals: number[], yearsAhead: number): number[] {
  const real = finals.filter((v) => v > 0);
  if (real.length === 0) return Array(yearsAhead).fill(0);
  const seq = [...finals];
  const out: number[] = [];
  for (let step = 0; step < yearsAhead; step++) {
    const window = seq.slice(-3);
    const weights = window.map((_, i) => i + 1);
    const est = trendEstimate(window, weights) || window[window.length - 1] || 0;
    out.push(est);
    seq.push(est);
  }
  return out;
}

export interface YearFigure {
  year: number;
  value: number;
  source: 'official' | 'estimated' | 'reference';
}

export interface EnggResultRow {
  code: string;
  name: string;
  location: string;
  rounds: number[]; // 10 real values, aligned to ENGG_ROUNDS (2022-2024 all rounds, plus real 2025 R1)
  prediction: PredictionLevel;
  avgFinal: number;
  projected: YearFigure[]; // 2026 only (override-aware) — 2025 is now real data in `rounds`, not a trend guess
}

// 2025 now has a real, KEA-published Round 1 column (see `rounds`), so there's
// nothing left to estimate for 2025. Only 2026 is still a trend projection,
// and it's deliberately based on the three real Final rounds (2022-2024) —
// not on 2025 R1, since an R1 cutoff isn't comparable to a Final-round one.
function projectedYearsForEngg(overrides: OverrideStore, code: string, branch: string, category: string, arr: number[]): YearFigure[] {
  const finals = FINAL_IDX.map((i) => arr[i] || 0);
  const [est2026] = estimateFutureYears(finals, 1);
  const override = getOverrideFrom(overrides, 'engg', code, branch, category, 2026);
  if (override) return [{ year: 2026, value: override.cutoff, source: 'official' }];
  return [{ year: 2026, value: est2026, source: 'estimated' }];
}

export function predictEngg(rank: number, branch: string, category: string, overrides: OverrideStore): EnggResultRow[] {
  const rows: EnggResultRow[] = [];
  for (const [code, college] of Object.entries(ENGG)) {
    const branchData = college.b[branch];
    if (!branchData) continue;
    const arr = branchData[category];
    if (!arr) continue;
    const finals = FINAL_IDX.map((i) => arr[i]).filter((v) => v > 0);
    const avgFinal = finals.length > 0 ? finals.reduce((a, b) => a + b, 0) / finals.length : Infinity;
    const prediction = getPrediction(rank, avgFinal === Infinity ? 0 : avgFinal);
    rows.push({
      code,
      name: college.n,
      location: college.l,
      rounds: arr,
      prediction,
      avgFinal,
      projected: projectedYearsForEngg(overrides, code, branch, category, arr),
    });
  }
  rows.sort((a, b) => PREDICTION_ORDER[a.prediction] - PREDICTION_ORDER[b.prediction] || a.avgFinal - b.avgFinal);
  return rows;
}

export interface AgriResultRow {
  code: string;
  name: string;
  location: string;
  values: Record<string, number>; // round key -> value
  prediction: PredictionLevel;
  refVal: number;
  projected: YearFigure[];
}

export function predictAgri(rank: number, branch: string, category: string, overrides: OverrideStore): AgriResultRow[] {
  const rows: AgriResultRow[] = [];
  for (const [code, college] of Object.entries(AGRI)) {
    const branchData = college.b[branch];
    if (!branchData) continue;
    const values: Record<string, number> = {};
    AGRI_ROUND_KEYS.forEach((rk) => {
      values[rk] = branchData.r?.[rk]?.[category] ?? 0;
    });
    const refVal = values['2024_R2'] || values['2024_R1'] || 0;
    if (!refVal) continue;
    const prediction = getPrediction(rank, refVal);
    // Only one real year (2024) is present in this dataset, so there's no
    // multi-year trend to project from; carry the last known figure forward
    // as a flat reference unless the admin has entered a real later-year cutoff.
    const projected: YearFigure[] = [2025, 2026].map((year) => {
      const override = getOverrideFrom(overrides, 'agri', code, branch, category, year);
      if (override) return { year, value: override.cutoff, source: 'official' as const };
      return { year, value: refVal, source: 'reference' as const };
    });
    rows.push({ code, name: college.n, location: college.l, values, prediction, refVal, projected });
  }
  rows.sort((a, b) => PREDICTION_ORDER[a.prediction] - PREDICTION_ORDER[b.prediction] || a.refVal - b.refVal);
  return rows;
}

export interface ProfResultRow {
  code: string;
  name: string;
  location: string;
  cutoff: number;
  prediction: PredictionLevel;
  projected: YearFigure[];
}

export function predictProf(rank: number, branch: string, category: string, overrides: OverrideStore): ProfResultRow[] {
  const rows: ProfResultRow[] = [];
  for (const [code, college] of Object.entries(PROF)) {
    const branchData = college.b[branch];
    if (!branchData) continue;
    const cutoff = branchData.d?.[category];
    if (!cutoff) continue;
    const prediction = getPrediction(rank, cutoff);
    const projected: YearFigure[] = [2025, 2026].map((year) => {
      const override = getOverrideFrom(overrides, 'prof', code, branch, category, year);
      if (override) return { year, value: override.cutoff, source: 'official' as const };
      return { year, value: cutoff, source: 'reference' as const };
    });
    rows.push({ code, name: college.n, location: college.l, cutoff, prediction, projected });
  }
  rows.sort((a, b) => PREDICTION_ORDER[a.prediction] - PREDICTION_ORDER[b.prediction] || a.cutoff - b.cutoff);
  return rows;
}

export function countPredictions(rows: Array<{ prediction: PredictionLevel }>) {
  const counts: Record<PredictionLevel, number> = { safe: 0, moderate: 0, borderline: 0, longshot: 0, unknown: 0 };
  rows.forEach((r) => counts[r.prediction]++);
  return counts;
}

export { ENGG_ROUNDS, AGRI_ROUNDS };
export type { CourseType };
