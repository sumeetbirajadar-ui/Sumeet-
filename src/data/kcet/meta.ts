// Round labels and category metadata for the KCET predictor.
// ENGG data columns line up positionally with ENGG_ROUNDS; FINAL_IDX picks out
// the three "Final" round columns (one per year) used for trend estimation.

export const ENGG_ROUNDS = [
  '2022 R1', '2022 R2', '2022 Final',
  '2023 R1', '2023 R2', '2023 Final',
  '2024 R1', '2024 R2', '2024 Final',
];

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
];

export type CourseType = 'engg' | 'agri' | 'prof' | 'bams';
