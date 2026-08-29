// Carries a logged-in student's personal tracker data (syllabus progress,
// habits, mock tests, targets, journal, etc.) to Firestore under their
// account uid, so it survives logout, a cleared browser, or a new phone —
// not just a single device's localStorage. Pulled down on login, pushed up
// on an interval / logout / tab-hide while the app is open.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { STUDENT_KEY_PREFIXES, STUDENT_EXACT_KEYS } from './backup';

const COLLECTION = 'student_cloud_backups';

function collectLocalData(studentId: string): Record<string, string> {
  const data: Record<string, string> = {};
  STUDENT_KEY_PREFIXES.forEach((prefix) => {
    const value = localStorage.getItem(prefix + studentId);
    if (value !== null) data[prefix + studentId] = value;
  });
  STUDENT_EXACT_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });
  return data;
}

export async function pushStudentDataToCloud(uid: string): Promise<void> {
  if (!db || !uid) return;
  try {
    const data = collectLocalData(uid);
    await setDoc(doc(db, COLLECTION, uid), { data, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Cloud backup push failed:', err);
  }
}

export async function pullStudentDataFromCloud(uid: string): Promise<boolean> {
  if (!db || !uid) return false;
  try {
    const snap = await getDoc(doc(db, COLLECTION, uid));
    if (!snap.exists()) return false;
    const cloudData = (snap.data()?.data || {}) as Record<string, string>;
    Object.entries(cloudData).forEach(([key, value]) => {
      if (typeof value === 'string') localStorage.setItem(key, value);
    });
    return true;
  } catch (err) {
    console.error('Cloud backup pull failed:', err);
    return false;
  }
}

// A brand-new account should keep whatever this browser already tracked
// under its old, random device id — copy it over to the new account id
// before the account id becomes the id everything reads/writes under.
export function migrateLocalDataToUid(oldStudentId: string, newUid: string): void {
  if (!oldStudentId || oldStudentId === newUid) return;
  STUDENT_KEY_PREFIXES.forEach((prefix) => {
    const value = localStorage.getItem(prefix + oldStudentId);
    if (value !== null) localStorage.setItem(prefix + newUid, value);
  });
}
