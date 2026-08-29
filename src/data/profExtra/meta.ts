// Karnataka UGCET-2025 cutoff ranks for additional professional courses
// (Architecture, Pharmacy, Nursing, Allied Health Sciences, Veterinary,
// Agricultural Engineering, Sericulture, etc.) beyond what's in the main
// Engineering/Agriculture/Veterinary predictor. Sourced directly from KEA's
// official 'Non-Interactive Admission System' cutoff-rank reports, Round 1
// through Round 3 where published — not every branch has all three rounds
// (e.g. Sericulture only ever got a Round 1 report; the app hides whichever
// round columns have no real data for the search you run).

import { CategoryOption, buildCategoryOptions } from '../ayushCategoryLabels';
export type { CategoryOption };

export const PROFX_ROUNDS = ['2025 R1', '2025 R2', '2025 R3'];

export interface BranchOption { value: string; label: string }

export const PROFX_BRANCH_OPTIONS: BranchOption[] = [
  { value: 'agricultural_engineering', label: "Agricultural Engineering" },
  { value: 'agricultural_engineering_pract', label: "Agricultural Engineering (Practical)" },
  { value: 'agriculture_pract', label: "Agriculture (Practical)" },
  { value: 'architecture', label: "Architecture" },
  { value: 'b_pharma', label: "B.Pharma" },
  { value: 'agri_bsc_theory', label: "B.Sc. Agriculture (Theory)" },
  { value: 'b_sc_ahs', label: "B.Sc. Allied Health Sciences" },
  { value: 'nursing', label: "B.Sc. Nursing" },
  { value: 'bpo', label: "BPO (Prosthetics & Orthotics)" },
  { value: 'bpt', label: "BPT (Physiotherapy)" },
  { value: 'food_sci_pract', label: "Food Science (Practical)" },
  { value: 'food_sci_theory', label: "Food Science (Theory)" },
  { value: 'medical_record_technology', label: "Medical Record Technology" },
  { value: 'naturopathy_yoga', label: "Naturopathy & Yoga" },
  { value: 'pharm_d', label: "Pharm.D" },
  { value: 'sericulture_pract', label: "Sericulture (Practical)" },
  { value: 'sericulture_theory', label: "Sericulture (Theory)" },
  { value: 'veter_sci_pract', label: "Veterinary Science (Practical)" },
  { value: 'veter_sci_theory', label: "Veterinary Science (Theory)" },
];

// Exact set of category codes present per branch (verified against
// karnataka.json) — categories vary branch to branch since KEA doesn't
// offer every reservation code for every course.
export const PROFX_CATEGORY_CODES_BY_BRANCH: Record<string, string[]> = {
  agricultural_engineering: ["1G", "1H", "2AG", "2AH", "2AK", "2AKH", "2BG", "2BH", "3AG", "3AH", "3AR", "3BG", "3BH", "3BR", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "SCG", "SCH", "SCK", "SCR", "SCRH", "STG", "STH"],
  agricultural_engineering_pract: ["1G", "1H", "2AG", "2AH", "2AR", "2ARH", "2BG", "2BH", "3AH", "3BG", "3BH", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "SCG", "SCH", "STG", "STH", "STR"],
  agriculture_pract: ["1G", "1H", "1K", "1R", "2AG", "2AH", "2AK", "2AKH", "2AR", "2ARH", "2BG", "2BH", "2BK", "2BR", "2BRH", "3AG", "3AH", "3AK", "3AR", "3ARH", "3BG", "3BH", "3BK", "3BR", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "SCG", "SCH", "SCK", "SCKH", "SCR", "SCRH", "STG", "STH", "STK", "STKH", "STR", "STRH"],
  architecture: ["1G", "2AG", "2AH", "2AR", "2BG", "3AG", "3AR", "3BG", "3BR", "GM", "GMH", "GMK", "GMR", "SCG", "STG"],
  b_pharma: ["1G", "1H", "1K", "1KH", "1R", "1RH", "2AG", "2AH", "2AK", "2AKH", "2AR", "2ARH", "2BG", "2BH", "2BK", "2BR", "2BRH", "3AG", "3AH", "3AK", "3AKH", "3AR", "3ARH", "3BG", "3BH", "3BK", "3BKH", "3BR", "3BRH", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "SCG", "SCH", "SCK", "SCKH", "SCR", "SCRH", "STG", "STH", "STK", "STR", "STRH"],
  agri_bsc_theory: ["1G", "1H", "1K", "1R", "1RH", "2AG", "2AH", "2AK", "2AKH", "2AR", "2ARH", "2BG", "2BH", "2BR", "2BRH", "3AG", "3AH", "3AK", "3AR", "3BG", "3BH", "3BK", "3BR", "3BRH", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "SCG", "SCH", "SCK", "SCKH", "SCR", "SCRH", "STG", "STH", "STK", "STKH", "STR", "STRH"],
  b_sc_ahs: ["1G", "1H", "2AG", "2AH", "2BG", "2BH", "3AG", "3AH", "3BG", "3BH", "GM", "GMH", "SCG", "SCH", "STG", "STH"],
  nursing: ["1G", "1H", "1K", "1KH", "1R", "1RH", "2AG", "2AH", "2AK", "2AKH", "2AR", "2ARH", "2BG", "2BH", "2BK", "2BKH", "2BR", "2BRH", "3AG", "3AH", "3AK", "3AKH", "3AR", "3ARH", "3BG", "3BH", "3BK", "3BKH", "3BR", "3BRH", "GM", "GMH", "GMK", "GMKH", "GMP", "GMPH", "GMR", "GMRH", "OPN", "SCG", "SCH", "SCK", "SCKH", "SCR", "SCRH", "STG", "STH", "STK", "STKH", "STR", "STRH"],
  bpo: ["1G", "1H", "2AG", "2AH", "2BG", "3AG", "3BG", "3BH", "GM", "GMH", "SCG", "SCH", "STG"],
  bpt: ["1G", "1H", "1K", "1R", "2AG", "2AH", "2AK", "2AKH", "2AR", "2ARH", "2BG", "2BH", "2BK", "2BR", "3AG", "3AH", "3AK", "3AR", "3BG", "3BH", "3BK", "3BR", "3BRH", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "SCG", "SCH", "SCK", "SCKH", "SCR", "SCRH", "STG", "STH", "STK", "STR"],
  food_sci_pract: ["1G", "1H", "1R", "2AG", "2AH", "2AK", "2AR", "2BG", "2BH", "2BR", "3AG", "3AH", "3AR", "3BG", "3BK", "3BRH", "GM", "GMH", "GMK", "GMR", "GMRH", "SCG", "SCH", "SCK", "SCR", "STG", "STH", "STR", "STRH"],
  food_sci_theory: ["1G", "1H", "1R", "2AG", "2AH", "2AK", "2AR", "2BG", "2BK", "2BR", "3AG", "3AH", "3AR", "3BG", "3BR", "3BRH", "GM", "GMH", "GMK", "GMR", "GMRH", "SCG", "SCH", "SCK", "SCR", "STG", "STH", "STRH"],
  medical_record_technology: ["1G", "2AG", "3AG", "3BG", "GM", "SCG", "STG"],
  naturopathy_yoga: ["1G", "1H", "1K", "2AG", "2AH", "2AK", "2AR", "2BG", "3AG", "3AR", "3BG", "3BH", "3BK", "3BR", "GM", "GMH", "GMK", "GMKH", "GMP", "GMR", "GMRH", "OPN", "SCG", "SCH", "SCK", "SCR", "STG", "STH"],
  pharm_d: ["1G", "1H", "1K", "1R", "2AG", "2AH", "2AK", "2AR", "2ARH", "2BG", "2BH", "2BK", "2BR", "3AG", "3BG", "3BK", "3BR", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "SCG", "SCH", "SCK", "SCR", "SCRH", "STG", "STH", "STK", "STR"],
  sericulture_pract: ["1G", "1H", "2AG", "2AH", "2AR", "2ARH", "2BG", "2BH", "3AH", "3BG", "3BH", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "SCG", "SCH", "STG", "STH", "STR"],
  sericulture_theory: ["1G", "2AG", "2AK", "2BG", "3AG", "3AR", "3BG", "3BR", "GM", "GMK", "GMR", "SCG", "SCK", "SCR", "STG"],
  veter_sci_pract: ["1G", "1H", "1R", "2AG", "2AH", "2AK", "2AR", "2ARH", "2BG", "2BR", "2BRH", "3AG", "3AR", "3ARH", "3BG", "3BH", "3BR", "GM", "GMH", "GMKH", "GMR", "GMRH", "SCG", "SCH", "SCK", "SCKH", "SCR", "SCRH", "STG", "STH", "STR"],
  veter_sci_theory: ["1G", "1H", "1R", "2AG", "2AH", "2AK", "2AR", "2ARH", "2BG", "2BR", "2BRH", "3AG", "3AR", "3ARH", "3BG", "3BH", "3BR", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "SCG", "SCH", "SCK", "SCKH", "SCR", "SCRH", "STG", "STH", "STR"],
};

export const PROFX_CATEGORY_OPTIONS_BY_BRANCH: Record<string, CategoryOption[]> = Object.fromEntries(
  Object.entries(PROFX_CATEGORY_CODES_BY_BRANCH).map(([code, cats]) => [code, buildCategoryOptions(cats)])
);
