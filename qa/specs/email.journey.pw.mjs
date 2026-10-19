import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { test, expect, request } from '@playwright/test';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';

const config = JSON.parse(readFileSync(new URL('../../firebase-applet-config.json', import.meta.url), 'utf8'));

// Keep credentials and Firebase responses in memory. No storage-state files,
// traces, video, account screens, or response bodies are attached. The only
// screenshots crop the fictional opportunity card, excluding account controls.
test('real Basic email account completes onboarding, persistence, opportunities and sign-in', async ({ page }, testInfo) => {
  const cleanup = await request.newContext({ timeout: 20000 });
  const suffix = randomUUID();
  const email = `aim-qa-${suffix}@example.com`;
  const password = `AIM-${randomUUID()}-7z!`;
  let token, uid, primaryError;
  const sdkApp = initializeApp(config, `email-journey-${suffix}`);
  const sdkAuth = getAuth(sdkApp);
  const db = getFirestore(sdkApp, config.firestoreDatabaseId);
  const verified = [];
  const note = name => { verified.push(name); testInfo.annotations.push({ type: 'verified', description: `${name}: PASS` }); };
  async function enterCredentials() {
    // Evaluate is recorded without its argument values; locator.fill(password)
    // would put the generated password in Playwright's HTML step title.
    await page.evaluate(({ email, password }) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      for (const [type, value] of [['email', email], ['password', password]]) {
        const input = document.querySelector(`form input[type="${type}"]`);
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, { email, password });
  }

  // API failures are sanitized because Playwright's request error may include
  // Authorization or preview-access headers. Never use raw errors as evidence.
  async function safeRequest(method, url, options = {}) {
    try { return await cleanup[method](url, { ...options, maxRedirects: 0 }); }
    catch { throw new Error('Test-account request failed; credential-bearing details withheld.'); }
  }
  async function authCall(operation, data) {
    const response = await safeRequest('post', `https://identitytoolkit.googleapis.com/v1/accounts:${operation}?key=${config.apiKey}`, { data });
    if (!response.ok()) throw new Error(`Disposable-account ${operation} rejected (${response.status()}).`);
    return response.json();
  }
  async function readDocument(path) {
    try {
      const snapshot = await getDoc(doc(db, 'users', uid, ...path.split('/')));
      return snapshot.exists() ? snapshot.data() : null;
    } catch { throw new Error('Saved disposable-account record could not be read.'); }
  }
  async function clearTestAccount() {
    // The client SDK uses the same named-database rules as AIM. Only this run's
    // authenticated UID can be read or deleted; no Admin credentials are needed.
    try {
      const session = await signInWithEmailAndPassword(sdkAuth, email, password);
      if (session.user.uid !== uid) throw new Error('Identity mismatch');
      for (const name of ['projects', 'schedules', 'goals', 'memories', 'wellness', 'life_updates', 'daily_plans', 'settings']) {
        const ref = collection(db, 'users', uid, name);
        const records = await getDocs(ref);
        for (const record of records.docs) await deleteDoc(record.ref);
        if (!(await getDocs(ref)).empty) throw new Error('Records remain');
      }
      await deleteDoc(doc(db, 'users', uid));
      await deleteUser(session.user);
      try { await signInWithEmailAndPassword(sdkAuth, email, password); }
      catch { note('Disposable data and identity cleanup'); return; }
      throw new Error('Identity remains');
    } catch { throw new Error('Disposable QA account cleanup failed; owner review required.'); }
  }
  try {
    const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (secret) {
      try {
        const response = await page.request.get('/', {
          headers: { 'x-vercel-protection-bypass': secret, 'x-vercel-set-bypass-cookie': 'true' }, maxRedirects: 0,
        });
        if (response.status() >= 400) throw new Error();
      } catch { throw new Error('BLOCKED: authorized preview access failed.'); }
    }
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Get started', exact: true })).toBeVisible();

    await test.step('Create a real disposable email account through AIM', async () => {
      await page.getByRole('button', { name: 'Get started', exact: true }).click();
      await page.getByRole('button', { name: 'Create Account', exact: true }).click();
      const form = page.locator('form').filter({ has: page.locator('input[type="email"]') });
      await enterCredentials();
      const signupResponse = page.waitForResponse(r => r.url().startsWith('https://identitytoolkit.googleapis.com/') && r.url().includes('accounts:signUp'));
      await form.locator('button[type="submit"]').click();
      const signup = await (await signupResponse).json();
      if (!signup.idToken || !signup.localId) throw new Error('BLOCKED: Firebase did not create the disposable test session.');
      token = signup.idToken; uid = signup.localId;
      try { await signInWithEmailAndPassword(sdkAuth, email, password); }
      catch { throw new Error('Disposable SDK session could not be established.'); }
      // Remove credentials retained in the hidden auth form before any failure snapshot.
      await page.locator('input[type="password"]').evaluateAll(nodes => nodes.forEach(n => { n.value = ''; }));
      await expect(page.locator('#aim-current-state-textarea')).toBeVisible({ timeout: 45000 });
      note('Email signup and workspace loading');
    });

    await test.step('Answer all three questions, verify Back, and request real AI pathways', async () => {
      await page.locator('#aim-current-state-textarea').fill('I am starting an illustration business and need steady work with illustration clients. I also want to sleep better.');
      await page.getByRole('button', { name: /Next: What you want to change/ }).click();
      const changes = 'I have two hours available today and want a small, clear plan.';
      await page.locator('#aim-changes-wanted-textarea').fill(changes);
      await page.getByRole('button', { name: /Next: Who you want to be/ }).click();
      await page.locator('#aim-desired-state-textarea').fill('I want to earn a steady living as an illustrator.');
      await page.getByRole('button', { name: /Back/ }).click();
      await expect(page.locator('#aim-changes-wanted-textarea')).toHaveValue(changes);
      await page.getByRole('button', { name: /Next: Who you want to be/ }).click();
      await expect(page.locator('#aim-desired-state-textarea')).toHaveValue('I want to earn a steady living as an illustrator.');
      let result;
      for (let attempt = 0; attempt < 2; attempt++) {
        const generated = page.waitForResponse(r => r.url().endsWith('/api/aim/cross-reference'), { timeout: 120000 });
        await page.getByRole('button', { name: 'Build my starting plan', exact: true }).click();
        const response = await generated;
        if (response.status() === 503 && attempt === 0) {
          await expect(page.getByText('AIM couldn’t build your plan right now. Your answers are saved. Please try again.')).toBeVisible();
          await expect(page.locator('#aim-desired-state-textarea')).toHaveValue('I want to earn a steady living as an illustrator.');
          note('AI outage preserves answers and presents recovery');
          continue;
        }
        expect(response.status(), 'Real AI pathway endpoint after at most one UI recovery').toBe(200);
        result = await response.json();
        break;
      }
      expect(result.source, 'A fallback is not real AI generation').not.toBe('fallback');
      expect(result.pathways?.length, 'AI returns usable pathways').toBeGreaterThan(0);
      await expect(page.locator('#aim-pathway-selection-module')).toBeVisible({ timeout: 90000 });
      await page.getByRole('button', { name: 'Use this plan', exact: true }).first().click();
      await expect(page.locator('#aim-first-run-intro')).toBeVisible({ timeout: 45000 });
      note('Three-answer onboarding, Back navigation and real AI plan generation');
    });

    let savedPlan;
    await test.step('Reload from Firebase and finish the first-run guide', async () => {
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await expect(page.locator('#aim-first-run-intro')).toBeVisible({ timeout: 45000 });
      await page.locator('#aim-first-run-next-intro').click();
      await page.locator('#aim-first-run-next-planner').click();
      await page.locator('#aim-first-run-next-check-in').click();
      await expect(page.locator('#aim-primary-nav')).toBeVisible();
      await page.locator('#nav-tab-planner').click();
      await expect(page.locator('#daily-planner-module')).toBeVisible();
      const plans = await getDocs(collection(db, 'users', uid, 'daily_plans'));
      savedPlan = plans.docs[0]?.data();
      expect(savedPlan?.priorityTasks?.length).toBeGreaterThan(0);
      note('Firebase plan reload and first-run guide persistence');
    });

    await test.step('Save a personal opportunity target and reload without the local cache', async () => {
      await page.locator('#nav-tab-scanner').click();
      const setup = page.locator('#opportunity-scanner-setup');
      await setup.locator('select').selectOption('creative');
      await setup.locator('textarea').fill('Illustration clients');
      await setup.locator('input').fill('Austin');
      await setup.locator('#save-opportunity-focus-btn').click();
      await expect(page.locator('#opportunity-scanner-screen')).toContainText('Illustration clients');
      await expect.poll(async () => JSON.stringify(await readDocument('settings/context')), { timeout: 20000 }).toContain('Illustration clients');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await expect(page.locator('#aim-primary-nav')).toBeVisible({ timeout: 45000 });
      await page.locator('#nav-tab-scanner').click();
      await expect(page.locator('#opportunity-scanner-screen')).toContainText('Illustration clients');
      await expect(page.locator('#opportunity-scanner-screen')).toContainText('Austin');
      await expect(page.locator('#opportunity-scanner-screen')).not.toContainText(/Fort Worth|DFW|driver jobs/i);
      note('User-defined opportunities persist in Firebase');
    });

    await test.step('Verify signed-in Basic access and Premium enforcement', async () => {
      await page.locator('#nav-tab-home').click();
      await page.getByRole('button', { name: 'Your Coaches', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Unlock AIM Premium' })).toBeVisible();
      await page.getByRole('button', { name: 'Close AIM Premium details', exact: true }).click();
      const freshToken = await sdkAuth.currentUser.getIdToken();
      for (const route of ['life-update-analyze', 'monetize', 'creative']) {
        let response;
        try {
          response = await page.request.post(`/api/aim/${route}`, { headers: { Authorization: `Bearer ${freshToken}` }, data: {}, maxRedirects: 0 });
        } catch { throw new Error('Authenticated Premium-boundary request failed; credential details withheld.'); }
        expect(response.status(), `Basic must not invoke ${route}`).toBe(403);
        expect((await response.json()).code).toBe('PREMIUM_REQUIRED');
      }
      note('Signed-in Basic Premium dialog and server enforcement');
      testInfo.annotations.push({ type: 'blocked', description: 'Actual reroute execution requires an authorized Premium test account; no entitlement was fabricated.' });
    });

    await test.step('Sign out and back in, then verify the saved account state', async () => {
      const account = page.locator('#aim-account-btn');
      const bounds = await account.boundingBox();
      expect(bounds?.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
      await account.click();
      await page.getByRole('button', { name: 'Sign Out of Account', exact: true }).click();
      await page.getByRole('button', { name: 'Get started', exact: true }).click();
      const form = page.locator('form').filter({ has: page.locator('input[type="email"]') });
      await enterCredentials();
      await form.locator('button[type="submit"]').click();
      await expect(page.locator('#aim-primary-nav')).toBeVisible({ timeout: 45000 });
      await page.locator('#nav-tab-planner').click();
      await expect(page.locator('#daily-planner-module')).toContainText(savedPlan.priorityTasks[0].task);
      expect(await readDocument(`daily_plans/${savedPlan.date}`)).toEqual(savedPlan);
      await page.locator('#nav-tab-scanner').click();
      await expect(page.locator('#opportunity-scanner-screen')).toContainText('Illustration clients');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const screenshotOptions = { style: '#aim-main-header, #aim-primary-nav, #aim-primary-nav * { opacity: 0 !important; visibility: hidden !important; }' };
      await testInfo.attach('fictional-opportunity-phone', { body: await page.locator('#opportunity-scanner-screen').screenshot(screenshotOptions), contentType: 'image/png' });
      await page.setViewportSize({ width: 1280, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await testInfo.attach('fictional-opportunity-desktop', { body: await page.locator('#opportunity-scanner-screen').screenshot(screenshotOptions), contentType: 'image/png' });
      note('Email sign-out/sign-in persistence and phone/desktop bounds');
    });
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    testInfo.setTimeout(testInfo.timeout + 90000);
    try { if (uid && token) await clearTestAccount(); }
    catch (error) {
      testInfo.annotations.push({ type: 'cleanup', description: 'FAILED: disposable QA account cleanup needs owner review.' });
      if (!primaryError) throw error;
    } finally {
      await cleanup.dispose();
      await deleteApp(sdkApp);
      await testInfo.attach('journey-results', { body: JSON.stringify({ commit: process.env.AIM_TESTED_SHA, verified, googleOAuth: 'BLOCKED: interactive Google test profile required', premiumReroute: 'BLOCKED: no authorized Premium account; Basic access enforcement tested', purchases: 'NOT TESTED' }, null, 2), contentType: 'application/json' });
    }
  }
});
