import karnatakaMbbs from '../data/mbbs/karnataka.json';
import { PredictionLevel, getPrediction } from './kcetPredictor';
import { QuotaType } from '../data/ayushCategoryLabels';

interface MbbsCollege {
  n: string;
  l: string;
  quotas: Record<string, Record<string, number[]>>; // quota -> category -> [R3] closing rank
}

const DATA = karnatakaMbbs as unknown as Record<string, MbbsCollege>;

const PREDICTION_ORDER: Record<PredictionLevel, number> = {
  safe: 0,
  moderate: 1,
  borderline: 2,
  longshot: 3,
  unknown: 4,
};

export interface MbbsResultRow {
  code: string;
  name: string;
  location: string;
  rounds: number[]; // R3 (final) closing rank
  prediction: PredictionLevel;
  refVal: number;
}

// 2025 Round 3 (final, court-ordered) only — the only round KEA's official
// document covered when this was built.
export function predictMbbs(rank: number, category: string, quota: QuotaType): MbbsResultRow[] {
  const rows: MbbsResultRow[] = [];
  for (const [code, college] of Object.entries(DATA)) {
    const arr = college.quotas[quota]?.[category];
    if (!arr) continue;
    const values = arr.filter((v) => v > 0);
    const refVal = values.length > 0 ? values[values.length - 1] : 0;
    const prediction = getPrediction(rank, refVal);
    rows.push({ code, name: college.n, location: college.l, rounds: arr, prediction, refVal });
  }
  rows.sort((a, b) => PREDICTION_ORDER[a.prediction] - PREDICTION_ORDER[b.prediction] || a.refVal - b.refVal);
  return rows;
}
