import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { test, expect, request } from '@playwright/test';

const config = JSON.parse(readFileSync(new URL('../../firebase-applet-config.json', import.meta.url), 'utf8'));

// Keep credentials and Firebase responses in memory. No storage-state files,
// traces, video, authenticated screenshots, or response bodies are attached.
test('real email account completes onboarding, persistence, opportunities and rerouting', async ({ page }, testInfo) => {
  const cleanup = await request.newContext({ timeout: 20000 });
  const suffix = randomUUID();
  const email = `aim-qa-${suffix}@example.com`;
  const password = `AIM-${randomUUID()}-7z!`;
  let token, uid;
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
  const database = config.firestoreDatabaseId || '(default)';
  const documents = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${database}/documents`;
  async function readDocument(path) {
    const response = await safeRequest('get', `${documents}/users/${uid}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status() !== 200) throw new Error(`Saved test record unavailable (${response.status()}).`);
    return response.json();
  }
  async function clearTestAccount() {
    // Sign in only with this run's generated credentials; never accept another UID.
    const session = await authCall('signInWithPassword', { email, password, returnSecureToken: true });
    if (session.localId !== uid) throw new Error('Refusing cleanup: disposable-account identity mismatch.');
    token = session.idToken;
    for (const collection of ['projects', 'schedules', 'goals', 'memories', 'wellness', 'life_updates', 'daily_plans', 'settings']) {
      const response = await safeRequest('get', `${documents}/users/${uid}/${collection}?pageSize=100`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok()) throw new Error(`Disposable data cleanup could not list records (${response.status()}).`);
      const data = await response.json();
      if (data.nextPageToken) throw new Error('Unexpected disposable-account record count; cleanup halted.');
      for (const document of data.documents || []) {
        if (!document.name.startsWith(`projects/${config.projectId}/databases/${database}/documents/users/${uid}/`)) throw new Error('Refusing cleanup outside the disposable account.');
        const deletion = await safeRequest('delete', `https://firestore.googleapis.com/v1/${document.name}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!deletion.ok()) throw new Error('Disposable record cleanup rejected.');
      }
      const checked = await safeRequest('get', `${documents}/users/${uid}/${collection}?pageSize=1`, { headers: { Authorization: `Bearer ${token}` } });
      if (!checked.ok() || (await checked.json()).documents?.length) throw new Error('Disposable record cleanup not verified.');
    }
    const profile = await safeRequest('delete', `${documents}/users/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!profile.ok()) throw new Error('Disposable profile cleanup rejected.');
    await authCall('delete', { idToken: token });
    const rejected = await safeRequest('post', `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.apiKey}`, { data: { email, password, returnSecureToken: true } });
    if (rejected.status() !== 400 || (await rejected.json()).idToken) throw new Error('Disposable identity deletion not verified.');
    note('Disposable data and identity cleanup');
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
      const generated = page.waitForResponse(r => r.url().endsWith('/api/aim/cross-reference'), { timeout: 120000 });
      await page.getByRole('button', { name: 'Build my starting plan', exact: true }).click();
      const response = await generated;
      expect(response.status(), 'Real AI pathway endpoint').toBe(200);
      const result = await response.json();
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
      const planList = await safeRequest('get', `${documents}/users/${uid}/daily_plans?pageSize=10`, { headers: { Authorization: `Bearer ${token}` } });
      if (!planList.ok()) throw new Error('Saved daily plan could not be read.');
      savedPlan = (await planList.json()).documents?.[0];
      expect(savedPlan?.fields?.priorityTasks?.arrayValue?.values?.length).toBeGreaterThan(0);
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
      await expect.poll(async () => JSON.stringify((await readDocument('settings/context')).fields), { timeout: 20000 }).toContain('Illustration clients');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await expect(page.locator('#aim-primary-nav')).toBeVisible({ timeout: 45000 });
      await page.locator('#nav-tab-scanner').click();
      await expect(page.locator('#opportunity-scanner-screen')).toContainText('Illustration clients');
      await expect(page.locator('#opportunity-scanner-screen')).toContainText('Austin');
      await expect(page.locator('#opportunity-scanner-screen')).not.toContainText(/Fort Worth|DFW|driver jobs/i);
      note('User-defined opportunities persist in Firebase');
    });

    await test.step('Reroute through the real API and persist the confirmed change', async () => {
      await page.locator('#nav-tab-home').click();
      await page.getByRole('button', { name: 'Update my plan', exact: true }).click();
      await page.locator('#life-update-textarea').fill('I only have one hour available today, not two. Shorten my plan to fit one hour.');
      const analyzed = page.waitForResponse(r => r.url().endsWith('/api/aim/life-update-analyze'), { timeout: 90000 });
      await page.locator('#life-update-submit-btn').click();
      expect((await analyzed).status(), 'Real reroute API').toBe(200);
      await expect(page.locator('#btn-confirm-reroute')).toBeVisible({ timeout: 60000 });
      await page.locator('#btn-confirm-reroute').click();
      await expect(page.locator('#aim-rerouted-success-card')).toBeVisible({ timeout: 45000 });
      const updated = await readDocument(`daily_plans/${savedPlan.name.split('/').at(-1)}`);
      expect(JSON.stringify(updated.fields), 'Confirmed reroute changes the saved plan').not.toBe(JSON.stringify(savedPlan.fields));
      await page.locator('#nav-tab-planner').click();
      await expect(page.locator('#daily-planner-module')).toContainText(/1 Productive Hour/);
      note('Real life-update analysis and saved one-hour reroute');
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
      await expect(page.locator('#daily-planner-module')).toContainText(/1 Productive Hour/);
      await page.locator('#nav-tab-scanner').click();
      await expect(page.locator('#opportunity-scanner-screen')).toContainText('Illustration clients');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.setViewportSize({ width: 1280, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      note('Email sign-out/sign-in persistence and phone/desktop bounds');
    });
  } finally {
    testInfo.setTimeout(testInfo.timeout + 90000);
    try { if (uid && token) await clearTestAccount(); }
    finally {
      await cleanup.dispose();
      await testInfo.attach('journey-results', { body: JSON.stringify({ commit: process.env.AIM_TESTED_SHA, verified, googleOAuth: 'BLOCKED: interactive Google test profile required', purchases: 'NOT TESTED' }, null, 2), contentType: 'application/json' });
    }
  }
});
