// Round labels and category metadata for the KCET predictor.
// ENGG data columns line up positionally with ENGG_ROUNDS; FINAL_IDX picks out
// the three "Final" round columns (one per year) used for trend estimation.

export const ENGG_ROUNDS = [
  '2022 R1', '2022 R2', '2022 Final',
  '2023 R1', '2023 R2', '2023 Final',
  '2024 R1', '2024 R2', '2024 Final',
  '2025 R1',
];

// 2025 R1 (index 9) is real KEA data too, but it's not a "Final" round — KEA
// hadn't published a verified Round 2 / Final for 2025 at the time of writing,
// so it's excluded from the trend basis used to project 2026.
export const FINAL_IDX = [2, 5, 8];

export const AGRI_ROUNDS = ['2024 R1', '2024 R2'];
export const AGRI_ROUND_KEYS = ['2024_R1', '2024_R2'];

export interface CategoryOption {
  value: string;
  label: string;
}

// Karnataka's standard KEA reservation categories. The G/K/R suffix marks a
// horizontal variant (General / Kannada-medium / Rural or Hyderabad-Karnataka
// region) of the same vertical category.
export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'GM', label: 'GM — General Merit' },
  { value: 'GMK', label: 'GMK — General Merit (Kannada Medium)' },
  { value: 'GMR', label: 'GMR — General Merit (Rural / HK)' },
  { value: '1G', label: '1G — Category I (General)' },
  { value: '1K', label: '1K — Category I (Kannada Medium)' },
  { value: '1R', label: '1R — Category I (Rural / HK)' },
  { value: '2AG', label: '2AG — Category IIA (General)' },
  { value: '2AK', label: '2AK — Category IIA (Kannada Medium)' },
  { value: '2AR', label: '2AR — Category IIA (Rural / HK)' },
  { value: '2BG', label: '2BG — Category IIB (General)' },
  { value: '2BK', label: '2BK — Category IIB (Kannada Medium)' },
  { value: '2BR', label: '2BR — Category IIB (Rural / HK)' },
  { value: '3AG', label: '3AG — Category IIIA (General)' },
  { value: '3AK', label: '3AK — Category IIIA (Kannada Medium)' },
  { value: '3AR', label: '3AR — Category IIIA (Rural / HK)' },
  { value: '3BG', label: '3BG — Category IIIB (General)' },
  { value: '3BK', label: '3BK — Category IIIB (Kannada Medium)' },
  { value: '3BR', label: '3BR — Category IIIB (Rural / HK)' },
  { value: 'SCG', label: 'SCG — SC (General)' },
  { value: 'SCK', label: 'SCK — SC (Kannada Medium)' },
  { value: 'SCR', label: 'SCR — SC (Rural / HK)' },
  { value: 'STG', label: 'STG — ST (General)' },
  { value: 'STK', label: 'STK — ST (Kannada Medium)' },
  { value: 'STR', label: 'STR — ST (Rural / HK)' },
  // "H" variants: the 371(j) Hyderabad-Karnataka region quota, newly seen in
  // the 2025 R1 data as a category distinct from the general/Kannada/rural
  // codes above (not a duplicate of the "R" — Rural/HK — codes).
  { value: 'GMH', label: 'GMH — General Merit (Hyderabad-Karnataka)' },
  { value: 'GMKH', label: 'GMKH — General Merit (Kannada Medium, HK)' },
  { value: 'GMRH', label: 'GMRH — General Merit (Rural, HK)' },
  { value: '1H', label: '1H — Category I (Hyderabad-Karnataka)' },
  { value: '1KH', label: '1KH — Category I (Kannada Medium, HK)' },
  { value: '1RH', label: '1RH — Category I (Rural, HK)' },
  { value: '2AH', label: '2AH — Category IIA (Hyderabad-Karnataka)' },
  { value: '2AKH', label: '2AKH — Category IIA (Kannada Medium, HK)' },
  { value: '2ARH', label: '2ARH — Category IIA (Rural, HK)' },
  { value: '2BH', label: '2BH — Category IIB (Hyderabad-Karnataka)' },
  { value: '2BKH', label: '2BKH — Category IIB (Kannada Medium, HK)' },
  { value: '2BRH', label: '2BRH — Category IIB (Rural, HK)' },
  { value: '3AH', label: '3AH — Category IIIA (Hyderabad-Karnataka)' },
  { value: '3AKH', label: '3AKH — Category IIIA (Kannada Medium, HK)' },
  { value: '3ARH', label: '3ARH — Category IIIA (Rural, HK)' },
  { value: '3BH', label: '3BH — Category IIIB (Hyderabad-Karnataka)' },
  { value: '3BKH', label: '3BKH — Category IIIB (Kannada Medium, HK)' },
  { value: '3BRH', label: '3BRH — Category IIIB (Rural, HK)' },
  { value: 'SCH', label: 'SCH — SC (Hyderabad-Karnataka)' },
  { value: 'SCKH', label: 'SCKH — SC (Kannada Medium, HK)' },
  { value: 'SCRH', label: 'SCRH — SC (Rural, HK)' },
  { value: 'STH', label: 'STH — ST (Hyderabad-Karnataka)' },
  { value: 'STKH', label: 'STKH — ST (Kannada Medium, HK)' },
  { value: 'STRH', label: 'STRH — ST (Rural, HK)' },
];

export type CourseType = 'engg' | 'agri' | 'prof' | 'bams' | 'bhms' | 'bds' | 'mbbs' | 'profx';
