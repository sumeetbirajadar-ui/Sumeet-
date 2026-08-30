// Karnataka MBBS seat cutoffs via KEA's NEET-UG counselling, 2025
// admission cycle — Round 1, Round 2, and Round 3 (final, post-High-Court-
// order). Round 1/2 computed from KEA's official candidate-level seat
// allotment CSVs (closing rank = highest all-India rank actually allotted,
// per college/quota/category — Round 2's data includes a Status column,
// so only rows marked "Allotted" count, same as Round 3's methodology;
// Round 1's source list has no such column, so every row in it counts).
// Category codes are grouped by seat quota — Government uses the vertical/
// horizontal reservation matrix; Private/NRI/Management-Other use a
// different, much smaller code set (KEA doesn't subdivide those by
// reservation category the same way). See ayushCategoryLabels.ts for how
// codes are decoded into labels.

import { QuotaType, CategoryOption, buildCategoryOptions } from '../ayushCategoryLabels';
export { QUOTA_OPTIONS } from '../ayushCategoryLabels';
export type { QuotaType, CategoryOption };

export const MBBS_ROUNDS = ['2025 R1', '2025 R2', '2025 R3 (Final)'];

// Exact set of category codes present in the source data per quota
// (verified against karnataka.json).
export const MBBS_CATEGORY_CODES_BY_QUOTA: Record<QuotaType, string[]> = {
  GOVT: ['1G', '1H', '1K', '1KH', '1R', '1RH', '2AG', '2AH', '2AK', '2AKH', '2AR', '2ARH', '2BG', '2BH', '2BK', '2BKH', '2BR', '2BRH', '3AG', '3AH', '3AK', '3AKH', '3AR', '3ARH', '3BG', '3BH', '3BK', '3BKH', '3BR', '3BRH', 'CAP', 'D', 'GM', 'GMH', 'GMK', 'GMKH', 'GMR', 'GMRH', 'JK', 'NCC', 'PHM', 'S-G', 'SCG', 'SCH', 'SCK', 'SCKH', 'SCR', 'SCRH', 'SPO', 'STG', 'STH', 'STK', 'STKH', 'STR', 'STRH', 'XD'],
  PRIV: ['GMP', 'GMPH', 'MA', 'MC', 'ME', 'MEH', 'MM', 'MMH', 'MU', 'OPN', 'RC1', 'RC2', 'RC3', 'RC4', 'RC5', 'RC6', 'RC7', 'RC8'],
  NRI: ['NRI'],
  OTHERS: ['OTH'],
};

export const MBBS_CATEGORY_OPTIONS_BY_QUOTA: Record<QuotaType, CategoryOption[]> = {
  GOVT: buildCategoryOptions(MBBS_CATEGORY_CODES_BY_QUOTA.GOVT),
  PRIV: buildCategoryOptions(MBBS_CATEGORY_CODES_BY_QUOTA.PRIV),
  NRI: buildCategoryOptions(MBBS_CATEGORY_CODES_BY_QUOTA.NRI),
  OTHERS: buildCategoryOptions(MBBS_CATEGORY_CODES_BY_QUOTA.OTHERS),
};
