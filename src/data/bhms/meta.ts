// Karnataka BHMS (Homoeopathy) government-quota seat cutoffs via KEA's
// AYUSH counselling, 2025 admission cycle — Round 1 only so far (the
// official KEA-published "Allotment Cut-Off Ranks" report for AYUSH,
// Rest-of-Karnataka + 371(j) Kalyana Karnataka seat types combined).
// Sourced directly from the official KEA PDF, not a third-party
// aggregator — extracted and verified cell-by-cell against the source.

export const BHMS_ROUNDS = ['2025 R1'];

export interface CategoryOption {
  value: string;
  label: string;
}

const VERTICAL_LABELS: Record<string, string> = {
  GM: 'General Merit',
  '1': 'Category I',
  '2A': 'Category IIA',
  '2B': 'Category IIB',
  '3A': 'Category IIIA',
  '3B': 'Category IIIB',
  SC: 'Scheduled Caste',
  ST: 'Scheduled Tribe',
};

const HORIZONTAL_LABELS: Record<string, string> = {
  '': 'General',
  G: 'General',
  K: 'Kannada Medium',
  R: 'Rural',
  H: 'Hyderabad-Karnataka (Art. 371J)',
  RH: 'Rural + Hyderabad-Karnataka',
  KH: 'Kannada Medium + Hyderabad-Karnataka',
};

function decodeCategory(code: string): string {
  const verticalKeys = ['GM', '2A', '2B', '3A', '3B', 'SC', 'ST', '1'];
  const base = verticalKeys.find((v) => code.startsWith(v));
  if (!base) return code;
  const suffix = code.slice(base.length);
  const horizontal = HORIZONTAL_LABELS[suffix];
  if (horizontal === undefined) return code;
  const verticalLabel = VERTICAL_LABELS[base];
  return horizontal === 'General' ? `${code} — ${verticalLabel}` : `${code} — ${verticalLabel} (${horizontal})`;
}

// Exact set of category codes present in the source data (verified against
// karnataka.json) — every code that actually had a real allotment in the
// 2025 Round 1 report. Some category/horizontal combinations never had a
// seat allotted at any college, so they're intentionally absent.
export const BHMS_ALL_CATEGORY_CODES = [
  'GM', 'GMH', 'GMK', 'GMKH', 'GMR', 'GMRH',
  '1G', '1H', '1K', '1R',
  '2AG', '2AH', '2AK', '2AKH', '2AR', '2ARH',
  '2BG', '2BH', '2BK', '2BR',
  '3AG', '3AH', '3AK', '3AR',
  '3BG', '3BH', '3BK', '3BR',
  'SCG', 'SCH', 'SCK', 'SCKH', 'SCR', 'SCRH',
  'STG', 'STH', 'STK', 'STR',
];

export const BHMS_CATEGORY_OPTIONS: CategoryOption[] = BHMS_ALL_CATEGORY_CODES.map((code) => ({
  value: code,
  label: decodeCategory(code),
}));
