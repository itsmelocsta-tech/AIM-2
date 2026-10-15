import { expect, it, vi } from 'vitest';
const writes = vi.hoisted(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../src/services/firebaseClient', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...parts: string[]) => parts.join('/'),
  writeBatch: () => writes,
  getDoc: vi.fn(), setDoc: vi.fn(), collection: vi.fn(), getDocs: vi.fn(), deleteDoc: vi.fn(),
}));
import { firestoreRepository } from '../src/services/repositories/firestoreRepository';
it('saves the supplied life note and memory together in the signed-in account', async () => {
  const update = { id: 'note-one', content: 'My schedule changed' } as any;
  const memory = { id: 'memory-one', content: 'Schedule context' } as any;
  await firestoreRepository.saveLifeNote('fictional-user', update, memory);
  expect(writes.set).toHaveBeenCalledWith('users/fictional-user/life_updates/note-one', update, { merge: true });
  expect(writes.set).toHaveBeenCalledWith('users/fictional-user/memories/memory-one', memory, { merge: true });
  expect(writes.commit).toHaveBeenCalledOnce();
});
