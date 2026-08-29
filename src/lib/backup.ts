// JSON Backup & Restore — every student-tracker localStorage key, exported
// as one downloadable file and re-importable later. This is the safety net
// for data that only ever lives in this browser's localStorage: no backend,
// so no backup means real loss on a cleared cache or a new device.

export interface BackupFile {
  version: number;
  exportedAt: string;
  studentId: string;
  data: Record<string, string>;
}

export const STUDENT_KEY_PREFIXES = [
  'syllabus_progress_v1_',
  'syllabus_revision_v1_',
  'habits_list_v1_',
  'habits_log_v1_',
  'focus_sessions_v1_',
  'mock_tests_v1_',
  'error_log_v1_',
  'targets_v1_',
  'goals_v1_',
  'wellbeing_journal_v1_',
  'personal_care_items_v1_',
  'personal_care_log_v1_',
  'resources_custom_v1_',
  'resources_progress_v1_',
  'counselling_documents_v2_kcetApplication_',
  'counselling_documents_v2_kcetCounselling_',
  'counselling_documents_v2_neetApplication_',
  'counselling_documents_v2_neetCounselling_',
  'counselling_documents_v2_jeeApplication_',
  'counselling_allotments_v1_',
  'daily_tracker_app_state_',
];

// Keys that hold one value per device rather than per-studentId-suffix.
export const STUDENT_EXACT_KEYS = ['student_name'];

export function buildBackup(studentId: string): BackupFile {
  const data: Record<string, string> = {};
  STUDENT_KEY_PREFIXES.forEach((prefix) => {
    const value = localStorage.getItem(prefix + studentId);
    if (value !== null) data[prefix + studentId] = value;
  });
  STUDENT_EXACT_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });
  return { version: 1, exportedAt: new Date().toISOString(), studentId, data };
}

export function downloadBackup(studentId: string) {
  const backup = buildBackup(studentId);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prep-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function restoreBackup(studentId: string, json: string): { success: boolean; error?: string; keysRestored?: number } {
  let parsed: BackupFile;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, error: 'This file is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
    return { success: false, error: 'This does not look like a prep-tracker backup file.' };
  }
  let count = 0;
  Object.entries(parsed.data).forEach(([key, value]) => {
    if (typeof value !== 'string') return;
    if (STUDENT_EXACT_KEYS.includes(key)) {
      localStorage.setItem(key, value);
      count++;
      return;
    }
    const prefix = STUDENT_KEY_PREFIXES.find((p) => key.startsWith(p));
    if (!prefix) return;
    localStorage.setItem(prefix + studentId, value);
    count++;
  });
  return { success: true, keysRestored: count };
}
