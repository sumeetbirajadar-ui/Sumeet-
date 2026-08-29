import karnatakaBhms from '../data/bhms/karnataka.json';
import { PredictionLevel, getPrediction } from './kcetPredictor';

interface BhmsCollege {
  n: string;
  l: string;
  cats: Record<string, number[]>; // [R1] closing rank
}

const DATA = karnatakaBhms as unknown as Record<string, BhmsCollege>;

const PREDICTION_ORDER: Record<PredictionLevel, number> = {
  safe: 0,
  moderate: 1,
  borderline: 2,
  longshot: 3,
  unknown: 4,
};

export interface BhmsResultRow {
  code: string;
  name: string;
  location: string;
  rounds: number[]; // R1 closing rank
  prediction: PredictionLevel;
  refVal: number;
}

// 2025 government-quota seats only, Round 1 (the only round KEA had
// published an aggregated cutoff-rank report for at the time this was
// built). Private/NRI/Other-quota BHMS seats aren't included.
export function predictBhms(rank: number, category: string): BhmsResultRow[] {
  const rows: BhmsResultRow[] = [];
  for (const [code, college] of Object.entries(DATA)) {
    const arr = college.cats[category];
    if (!arr) continue;
    const values = arr.filter((v) => v > 0);
    const refVal = values.length > 0 ? values[values.length - 1] : 0;
    const prediction = getPrediction(rank, refVal);
    rows.push({ code, name: college.n, location: college.l, rounds: arr, prediction, refVal });
  }
  rows.sort((a, b) => PREDICTION_ORDER[a.prediction] - PREDICTION_ORDER[b.prediction] || a.refVal - b.refVal);
  return rows;
}
