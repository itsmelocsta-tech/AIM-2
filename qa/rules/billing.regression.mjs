import { readFile } from 'node:fs/promises';
import { before, after, beforeEach, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-aim-rules', firestore: {
    host: '127.0.0.1', port: 8080, rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
  } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });
const premium = { plan: 'premium', status: 'active' };

test('owner cannot create, update, delete or batch-write a billing entitlement', async () => {
  const db = env.authenticatedContext('alice').firestore();
  const target = doc(db, 'users/alice/billing/entitlement');
  await assertFails(setDoc(target, premium));
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice/billing/entitlement'), { plan: 'basic', status: 'free' });
  });
  await assertFails(updateDoc(target, premium));
  await assertFails(setDoc(target, premium, { merge: true }));
  await assertFails(deleteDoc(target));
  const batch = writeBatch(db);
  batch.set(doc(db, 'users/alice/wellness/today'), { notes: 'Fictional note' });
  batch.set(target, premium);
  await assertFails(batch.commit());
  await assertFails(setDoc(doc(db, 'users/alice/billing/entitlement/history/attempt'), premium));
});

test('trusted writes remain readable only by the entitlement owner', async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice/billing/entitlement'), premium);
  });
  const owner = env.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(owner, 'users/alice/billing/entitlement')));
  await assertSucceeds(getDocs(collection(owner, 'users/alice/billing')));
  for (const ctx of [env.authenticatedContext('bob'), env.unauthenticatedContext()]) {
    await assertFails(getDoc(doc(ctx.firestore(), 'users/alice/billing/entitlement')));
    await assertFails(setDoc(doc(ctx.firestore(), 'users/alice/billing/entitlement'), premium));
  }
});

test('owners retain profile and nested workspace access while other users are denied', async () => {
  const owner = env.authenticatedContext('alice').firestore();
  for (const path of ['users/alice', 'users/alice/wellness/today', 'users/alice/projects/one/notes/two']) {
    await assertSucceeds(setDoc(doc(owner, path), { notes: 'Fictional saved work' }));
    await assertSucceeds(getDoc(doc(owner, path)));
    await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(), path)));
    await assertFails(updateDoc(doc(env.authenticatedContext('bob').firestore(), path), { notes: 'changed' }));
  }
  await assertSucceeds(getDocs(collection(owner, 'users/alice/wellness')));
});
