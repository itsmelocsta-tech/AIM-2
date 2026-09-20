import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: { currentUser: null as any, authStateReady: vi.fn() }, token: vi.fn() }));
vi.mock('firebase/app', () => ({ initializeApp: () => ({}), getApps: () => [], getApp: () => ({}) }));
vi.mock('firebase/firestore', () => ({ getFirestore: () => ({}) }));
vi.mock('firebase/auth', () => ({
  getAuth: () => mocks.auth, GoogleAuthProvider: class {}, signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(), onAuthStateChanged: vi.fn(), signInAnonymously: vi.fn(),
}));
import { getIdToken } from '../src/services/firebaseClient';
beforeEach(() => { vi.resetAllMocks(); mocks.auth.currentUser = null; });
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
