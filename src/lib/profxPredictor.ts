import karnatakaProfx from '../data/profExtra/karnataka.json';
import { PredictionLevel, getPrediction } from './kcetPredictor';

interface ProfxCollege {
  n: string;
  l: string;
  cats: Record<string, number[]>; // category -> [R1, R2, R3] closing rank
}

interface ProfxBranch {
  label: string;
  sourceName: string;
  rounds: number[];
  colleges: Record<string, ProfxCollege>;
}

const DATA = karnatakaProfx as unknown as Record<string, ProfxBranch>;

const PREDICTION_ORDER: Record<PredictionLevel, number> = {
  safe: 0,
  moderate: 1,
  borderline: 2,
  longshot: 3,
  unknown: 4,
};

export interface ProfxResultRow {
  code: string;
  name: string;
  location: string;
  rounds: number[]; // R1, R2, R3 closing rank (0 where that round has no report or no allotment)
  prediction: PredictionLevel;
  refVal: number;
}

// 2025 real KEA cutoffs for one of the "extra" professional-course branches
// (see profExtra/meta.ts). Not every branch has all three rounds published.
export function predictProfx(rank: number, branchCode: string, category: string): ProfxResultRow[] {
  const branch = DATA[branchCode];
  if (!branch) return [];
  const rows: ProfxResultRow[] = [];
  for (const [code, college] of Object.entries(branch.colleges)) {
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
