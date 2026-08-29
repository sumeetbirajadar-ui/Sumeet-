// Karnataka BAMS (Ayurveda) seat cutoffs via KEA's AYUSH counselling,
// 2024 admission cycle — Round 1, Round 2, Round 3 (Mop-up), all four seat
// quotas (Government/Private/NRI/Management-Other). Sourced from KEA's
// published round-wise allotment results, cross-checked cell-by-cell
// against the raw source tables before import.
// Category codes are grouped by seat quota — Government uses the vertical/
// horizontal reservation matrix; Private/NRI/Management-Other use a
// different, much smaller code set (KEA doesn't subdivide those by
// reservation category the same way). See ayushCategoryLabels.ts for how
// codes are decoded into labels.

import { QuotaType, CategoryOption, buildCategoryOptions } from '../ayushCategoryLabels';
export { QUOTA_OPTIONS } from '../ayushCategoryLabels';
export type { QuotaType, CategoryOption };

export const BAMS_ROUNDS = ['2024 R1', '2024 R2', '2024 R3 (Mop-up)'];

// Exact set of category codes present in the source data per quota
// (verified against karnataka.json).
export const BAMS_CATEGORY_CODES_BY_QUOTA: Record<QuotaType, string[]> = {
  GOVT: ['1G', '1H', '1K', '1R', '1RH', '2AG', '2AH', '2AK', '2AKH', '2AR', '2ARH', '2BG', '2BH', '2BK', '2BR', '2BRH', '3AG', '3AH', '3AK', '3AR', '3ARH', '3BG', '3BH', '3BK', '3BKH', '3BR', '3BRH', 'D', 'GM', 'GMH', 'GMK', 'GMKH', 'GMR', 'GMRH', 'NCC', 'PH', 'PHM', 'SCG', 'SCH', 'SCK', 'SCKH', 'SCR', 'SCRH', 'STG', 'STH', 'STK', 'STKH', 'STR', 'STRH', 'XD'],
  PRIV: ['OPN'],
  NRI: ['NRI'],
  OTHERS: ['OTH'],
};

export const BAMS_CATEGORY_OPTIONS_BY_QUOTA: Record<QuotaType, CategoryOption[]> = {
  GOVT: buildCategoryOptions(BAMS_CATEGORY_CODES_BY_QUOTA.GOVT),
  PRIV: buildCategoryOptions(BAMS_CATEGORY_CODES_BY_QUOTA.PRIV),
  NRI: buildCategoryOptions(BAMS_CATEGORY_CODES_BY_QUOTA.NRI),
  OTHERS: buildCategoryOptions(BAMS_CATEGORY_CODES_BY_QUOTA.OTHERS),
};
