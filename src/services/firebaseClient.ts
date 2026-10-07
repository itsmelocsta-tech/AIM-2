import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
// AIM data lives in a named database within this shared Firebase project.
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

declare global {
  interface Window { AIMAuth?: { postMessage: (message: string) => void; onmessage: ((event: MessageEvent) => void) | null }; }
}

async function nativeGoogleIdToken(): Promise<string> {
  const bridge = window.AIMAuth!;
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => { bridge.onmessage = null; reject(new Error('Google sign-in timed out. Try again.')); }, 120000);
    bridge.onmessage = event => {
      try {
        const result = JSON.parse(event.data);
        if (result.id !== id) return;
        clearTimeout(timer); bridge.onmessage = null;
        result.error ? reject(new Error(result.error)) : resolve(result.idToken);
      } catch { clearTimeout(timer); bridge.onmessage = null; reject(new Error('Google sign-in failed.')); }
    };
    bridge.postMessage(JSON.stringify({ action: 'googleSignIn', id }));
  });
}

export async function signInWithGoogle() {
  try {
    const result = window.AIMAuth
      ? await signInWithCredential(auth, GoogleAuthProvider.credential(await nativeGoogleIdToken()))
      : await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to sign in with Google' };
  }
}

export async function signInWithEmail(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to sign in' };
  }
}

export async function signUpWithEmail(email: string, pass: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to create account' };
  }
}

export async function signInAsGuest() {
  try {
    const result = await signInAnonymously(auth);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to initialize private guest session' };
  }
}

export async function logOut() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message || 'Failed to sign out' };
  }
}

export async function getIdToken(): Promise<string | null> {
  await auth.authStateReady();
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken();
}

export { onAuthStateChanged };
export type { FirebaseUser };
