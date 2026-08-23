// Shared Firebase backend for admin-authored content only (announcements,
// live classes, PYQ/notes resources, cutoff overrides, counselling dates).
// Personal student-tracker data (habits, journal, mock tests, syllabus
// progress, etc.) intentionally stays in localStorage — it's private,
// per-device, and doesn't need to sync from anywhere.

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, query, QueryConstraint } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

// Small generic helpers so each admin-content module (announcements, live
// classes, PYQ resources, cutoff overrides, counselling dates) doesn't have
// to repeat Firestore boilerplate. onSnapshot gives live sync for free: any
// admin write is pushed to every subscribed student in real time.

export function subscribeCollection<T>(
  collectionName: string,
  onData: (items: (T & { id: string })[]) => void,
  ...constraints: QueryConstraint[]
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T & { id: string })),
    (err) => console.error(`Firestore subscription failed for "${collectionName}":`, err)
  );
}

export async function addDocument<T extends object>(collectionName: string, data: T): Promise<string> {
  if (!db) throw new Error('Firebase is not configured — set the VITE_FIREBASE_* env vars.');
  const ref = await addDoc(collection(db, collectionName), data);
  return ref.id;
}

export async function updateDocument(collectionName: string, id: string, patch: object): Promise<void> {
  if (!db) throw new Error('Firebase is not configured — set the VITE_FIREBASE_* env vars.');
  await updateDoc(doc(db, collectionName, id), patch);
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured — set the VITE_FIREBASE_* env vars.');
  await deleteDoc(doc(db, collectionName, id));
}

// Single-document helpers, for config-shaped data (a whole blob read/written
// together) rather than a list of records — e.g. the cutoff-overrides store.

export function subscribeDoc<T>(path: string, id: string, onData: (data: T | null) => void): () => void {
  if (!db) {
    onData(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, path, id),
    (snap) => onData(snap.exists() ? (snap.data() as T) : null),
    (err) => console.error(`Firestore doc subscription failed for "${path}/${id}":`, err)
  );
}

export async function setDocument<T extends object>(path: string, id: string, data: T): Promise<void> {
  if (!db) throw new Error('Firebase is not configured — set the VITE_FIREBASE_* env vars.');
  await setDoc(doc(db, path, id), data);
}
