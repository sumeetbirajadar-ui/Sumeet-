// Rank <-> Marks Estimator — very rough, indicative bands only, built from
// broad public past-year trends. NOT a prediction tool: every year's cutoffs
// move with paper difficulty and number of aspirants. Used only to help a
// student frame a goal ("I want to be in the ~50k band"), never as a promise.

export type EstimatorExam = 'NEET' | 'JEE Main' | 'KCET';

export const RANK_ESTIMATE_DISCLAIMER =
  "These are rough, indicative bands based on broad past-year trends only — not a prediction. Actual ranks depend on that year's paper difficulty and number of aspirants.";

interface Band {
  minMarks: number;
  maxMarks: number;
  approxRank: string;
}

const NEET_BANDS: Band[] = [
  { minMarks: 680, maxMarks: 720, approxRank: 'Top ~1,000' },
  { minMarks: 650, maxMarks: 679, approxRank: '~1,000 – 5,000' },
  { minMarks: 600, maxMarks: 649, approxRank: '~5,000 – 20,000' },
  { minMarks: 550, maxMarks: 599, approxRank: '~20,000 – 50,000' },
  { minMarks: 500, maxMarks: 549, approxRank: '~50,000 – 1,00,000' },
  { minMarks: 450, maxMarks: 499, approxRank: '~1,00,000 – 2,00,000' },
  { minMarks: 0, maxMarks: 449, approxRank: 'Beyond ~2,00,000' },
];

const JEE_MAIN_BANDS: Band[] = [
  { minMarks: 280, maxMarks: 300, approxRank: 'Top ~500 (≈99.9+ percentile)' },
  { minMarks: 250, maxMarks: 279, approxRank: '~500 – 5,000' },
  { minMarks: 200, maxMarks: 249, approxRank: '~5,000 – 30,000' },
  { minMarks: 150, maxMarks: 199, approxRank: '~30,000 – 1,00,000' },
  { minMarks: 100, maxMarks: 149, approxRank: '~1,00,000 – 3,00,000' },
  { minMarks: 0, maxMarks: 99, approxRank: 'Beyond ~3,00,000' },
];

const KCET_BANDS: Band[] = [
  { minMarks: 160, maxMarks: 180, approxRank: 'Top ~500' },
  { minMarks: 140, maxMarks: 159, approxRank: '~500 – 3,000' },
  { minMarks: 110, maxMarks: 139, approxRank: '~3,000 – 10,000' },
  { minMarks: 80, maxMarks: 109, approxRank: '~10,000 – 30,000' },
  { minMarks: 50, maxMarks: 79, approxRank: '~30,000 – 60,000' },
  { minMarks: 0, maxMarks: 49, approxRank: 'Beyond ~60,000' },
];

const BANDS: Record<EstimatorExam, Band[]> = {
  NEET: NEET_BANDS,
  'JEE Main': JEE_MAIN_BANDS,
  KCET: KCET_BANDS,
};

export const ESTIMATOR_MAX_MARKS: Record<EstimatorExam, number> = {
  NEET: 720,
  'JEE Main': 300,
  KCET: 180,
};

export function estimateRankBand(exam: EstimatorExam, marks: number): string {
  const bands = BANDS[exam];
  const band = bands.find((b) => marks >= b.minMarks && marks <= b.maxMarks);
  return band ? band.approxRank : bands[bands.length - 1].approxRank;
}
