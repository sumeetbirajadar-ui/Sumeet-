// Real student accounts: email + password, backed by Firebase Authentication.
// This replaces the old "just type your name" student login with something
// that survives logout, a cleared browser, or a brand new phone — the
// account (not the device) is now the source of identity.

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { app, getDocument } from './firebase';

export const auth = app ? getAuth(app) : null;

export interface AuthResult {
  success: boolean;
  error?: string;
  uid?: string;
}

function friendlyAuthError(code: string | undefined): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists — try logging in instead.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts — please wait a bit and try again.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return "Student sign-in isn't turned on yet — ask your admin to enable Email/Password sign-in in Firebase.";
    default:
      return 'Something went wrong. Please check your connection and try again.';
  }
}

const NOT_SET_UP: AuthResult = {
  success: false,
  error: "Student sign-in isn't turned on yet — ask your admin to enable Email/Password sign-in in Firebase.",
};

export async function registerStudent(name: string, email: string, password: string): Promise<AuthResult> {
  if (!auth) return NOT_SET_UP;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
    return { success: true, uid: cred.user.uid };
  } catch (err: any) {
    return { success: false, error: friendlyAuthError(err?.code) };
  }
}

export async function loginStudent(email: string, password: string): Promise<AuthResult> {
  if (!auth) return NOT_SET_UP;
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, uid: cred.user.uid };
  } catch (err: any) {
    return { success: false, error: friendlyAuthError(err?.code) };
  }
}

// Admin sign-in is the exact same Firebase email/password flow as a student
// (loginStudent works fine for this) — the only difference is that "being
// signed in" isn't enough to grant admin access. After sign-in, the caller
// must also check isAllowedAdmin(uid): only a uid with a matching doc in the
// `admins` collection is treated as an admin. That doc can only be created
// from the Firebase Console or the Admin SDK (Firestore rules block writes
// to it from the app), so there is no self-service way to become an admin —
// deliberately, since this replaces what used to be a hardcoded password
// baked into the client JS.
export async function isAllowedAdmin(uid: string): Promise<boolean> {
  if (!auth) return false;
  const doc = await getDocument<{ role?: string }>('admins', uid);
  return doc !== null;
}

export async function logoutStudent(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function sendStudentPasswordReset(email: string): Promise<AuthResult> {
  if (!auth) return NOT_SET_UP;
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (err: any) {
    return { success: false, error: friendlyAuthError(err?.code) };
  }
}

export function getCurrentStudentUid(): string | null {
  return auth?.currentUser?.uid ?? null;
}

export function watchAuthState(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}
