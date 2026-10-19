import { readFile } from 'node:fs/promises';
import { before, after, beforeEach, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import assert from 'node:assert/strict';

let env;
const baseline = process.env.AIM_RULES_BASELINE === 'true';
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-aim-rules', firestore: {
    host: '127.0.0.1', port: 8080,
    rules: await readFile(new URL(baseline ? './owner-only-baseline.rules' : '../../firestore.rules', import.meta.url), 'utf8'),
  } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });
const premium = { plan: 'premium', status: 'active' };

test('global purchase token and event records are server-only', async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'billing_tokens/fictional-token'), { uid: 'alice' });
    await setDoc(doc(ctx.firestore(), 'billing_events/fictional-event'), { uid: 'alice' });
  });
  for (const context of [env.authenticatedContext('alice'), env.authenticatedContext('bob'), env.unauthenticatedContext()]) {
    for (const path of ['billing_tokens/fictional-token', 'billing_events/fictional-event']) {
      const target = doc(context.firestore(), path);
      await assertFails(getDoc(target));
      await assertFails(setDoc(target, { uid: 'alice' }));
      await assertFails(deleteDoc(target));
    }
  }
});

test('original rules reproduce the self-written entitlement boundary failure', { skip: !baseline }, async () => {
  const db = env.authenticatedContext('alice').firestore();
  const target = doc(db, 'users/alice/billing/entitlement');
  await assertSucceeds(setDoc(target, premium));
  assert.deepEqual((await getDoc(target)).data(), premium);
});

test('owner cannot create, update, delete or batch-write a billing entitlement', { skip: baseline }, async () => {
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
  assert.equal((await getDoc(doc(db, 'users/alice/wellness/today'))).exists(), false);
  await assertFails(setDoc(doc(db, 'users/alice/billing/entitlement/history/attempt'), premium));
  await assertFails(setDoc(doc(db, 'users/alice/billing/alternate'), premium));
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
    await assertSucceeds(updateDoc(doc(owner, path), { notes: 'Fictional updated work' }));
    await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(), path)));
    await assertFails(updateDoc(doc(env.authenticatedContext('bob').firestore(), path), { notes: 'changed' }));
  }
  await assertSucceeds(getDocs(collection(owner, 'users/alice/wellness')));
  const batch = writeBatch(owner);
  batch.set(doc(owner, 'users/alice/settings/context'), { location: 'Fictional town' });
  batch.set(doc(owner, 'users/alice/daily_plans/today'), { notes: 'Fictional plan' });
  await assertSucceeds(batch.commit());
  await assertSucceeds(deleteDoc(doc(owner, 'users/alice/wellness/today')));
});

test('profile deletion and recreation cannot unlock an existing billing record', { skip: baseline }, async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice/billing/entitlement'), premium);
  });
  const owner = env.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(doc(owner, 'users/alice'), { name: 'Fictional Alice' }));
  await assertSucceeds(deleteDoc(doc(owner, 'users/alice')));
  await assertSucceeds(setDoc(doc(owner, 'users/alice'), { name: 'Fictional Alice again' }));
  await assertFails(updateDoc(doc(owner, 'users/alice/billing/entitlement'), { status: 'trial' }));
  assert.deepEqual((await getDoc(doc(owner, 'users/alice/billing/entitlement'))).data(), premium);
});
