import karnatakaBds from '../data/bds/karnataka.json';
import { PredictionLevel, getPrediction } from './kcetPredictor';
import { QuotaType } from '../data/ayushCategoryLabels';

interface BdsCollege {
  n: string;
  l: string;
  quotas: Record<string, Record<string, number[]>>; // quota -> category -> [R1, R3] closing rank
}

const DATA = karnatakaBds as unknown as Record<string, BdsCollege>;

const PREDICTION_ORDER: Record<PredictionLevel, number> = {
  safe: 0,
  moderate: 1,
  borderline: 2,
  longshot: 3,
  unknown: 4,
};

export interface BdsResultRow {
  code: string;
  name: string;
  location: string;
  rounds: number[]; // R1, R3 closing rank
  prediction: PredictionLevel;
  refVal: number;
}

// 2025 Round 1 (final) + Round 3 (revised provisional); no Round 2
// document was available.
export function predictBds(rank: number, category: string, quota: QuotaType): BdsResultRow[] {
  const rows: BdsResultRow[] = [];
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
