import karnatakaBams from '../data/bams/karnataka.json';
import { PredictionLevel, getPrediction } from './kcetPredictor';
import { QuotaType } from '../data/ayushCategoryLabels';

interface BamsCollege {
  n: string;
  l: string;
  quotas: Record<string, Record<string, number[]>>; // quota -> category -> [R1, R2, R3] closing rank
}

const DATA = karnatakaBams as unknown as Record<string, BamsCollege>;

const PREDICTION_ORDER: Record<PredictionLevel, number> = {
  safe: 0,
  moderate: 1,
  borderline: 2,
  longshot: 3,
  unknown: 4,
};

export interface BamsResultRow {
  code: string;
  name: string;
  location: string;
  rounds: number[]; // R1, R2, R3 closing rank
  prediction: PredictionLevel;
  refVal: number;
}

// 2024 seats only. Only one admission year is available, so this shows the
// real 2024 numbers directly rather than a multi-year trend estimate.
export function predictBams(rank: number, category: string, quota: QuotaType): BamsResultRow[] {
  const rows: BamsResultRow[] = [];
  for (const [code, college] of Object.entries(DATA)) {
    const arr = college.quotas[quota]?.[category];
    if (!arr) continue;
    const values = arr.filter((v) => v > 0);
    const refVal = values.length > 0 ? values[values.length - 1] : 0; // latest round with a real allotment
    const prediction = getPrediction(rank, refVal);
    rows.push({ code, name: college.n, location: college.l, rounds: arr, prediction, refVal });
  }
  rows.sort((a, b) => PREDICTION_ORDER[a.prediction] - PREDICTION_ORDER[b.prediction] || a.refVal - b.refVal);
  return rows;
}
