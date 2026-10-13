import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: { currentUser: null as any, authStateReady: vi.fn() }, reset: vi.fn(), token: vi.fn(), firestoreArgs: [] as unknown[] }));
vi.mock('firebase/app', () => ({ initializeApp: () => ({}), getApps: () => [], getApp: () => ({}) }));
vi.mock('firebase/firestore', () => ({ getFirestore: (...args: unknown[]) => { mocks.firestoreArgs = args; return {}; } }));
vi.mock('firebase/auth', () => ({
  getAuth: () => mocks.auth, GoogleAuthProvider: class {}, signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(), onAuthStateChanged: vi.fn(), signInAnonymously: vi.fn(),
  sendPasswordResetEmail: mocks.reset,
}));
import { getIdToken, requestPasswordReset } from '../src/services/firebaseClient';
import firebaseConfig from '../firebase-applet-config.json';
beforeEach(() => { vi.resetAllMocks(); mocks.auth.currentUser = null; });
it('selects the existing named AIM database', () => {
  expect(mocks.firestoreArgs).toEqual([expect.anything(), firebaseConfig.firestoreDatabaseId]);
  expect(firebaseConfig.firestoreDatabaseId).not.toBe('(default)');
});
it('waits for restored session before reading the user', async () => {
  mocks.auth.authStateReady.mockImplementation(async () => { mocks.auth.currentUser = { getIdToken: mocks.token }; });
  mocks.token.mockResolvedValue('restored-token');
  expect(await getIdToken()).toBe('restored-token');
});
it('returns null only when restoration confirms there is no user', async () => {
  mocks.auth.authStateReady.mockResolvedValue(undefined);
  expect(await getIdToken()).toBeNull();
});
it('preserves token errors so network problems are not mistaken for sign-out', async () => {
  mocks.auth.currentUser = { getIdToken: mocks.token };
  mocks.token.mockRejectedValue(new Error('network failed'));
  await expect(getIdToken()).rejects.toThrow('network failed');
});
it('requests a reset for the typed address without revealing account existence', async () => {
  mocks.reset.mockResolvedValue(undefined);
  expect(await requestPasswordReset(' sam@example.invalid ')).toEqual({ error: null });
  expect(mocks.reset).toHaveBeenCalledWith(mocks.auth, 'sam@example.invalid');
  mocks.reset.mockRejectedValue({ code: 'auth/user-not-found' });
  expect(await requestPasswordReset('missing@example.invalid')).toEqual({ error: null });
  mocks.reset.mockRejectedValue({ code: 'auth/network-request-failed' });
  expect((await requestPasswordReset('sam@example.invalid')).error).toContain('retry');
});
