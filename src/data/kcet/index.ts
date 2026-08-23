import enggRaw from './engg.json';
import agriRaw from './agri.json';
import profRaw from './prof.json';

export interface EnggCollege {
  n: string; // name
  l: string; // location
  b: Record<string, Record<string, number[]>>; // branch -> category -> 9 round values
}

export interface AgriCollege {
  n: string;
  l: string;
  b: Record<string, { n: string; r: Record<string, Record<string, number>> }>;
}

export interface ProfCollege {
  n: string;
  l: string;
  b: Record<string, { n: string; d: Record<string, number> }>;
}

export const ENGG = enggRaw as unknown as Record<string, EnggCollege>;
export const AGRI = agriRaw as unknown as Record<string, AgriCollege>;
export const PROF = profRaw as unknown as Record<string, ProfCollege>;
