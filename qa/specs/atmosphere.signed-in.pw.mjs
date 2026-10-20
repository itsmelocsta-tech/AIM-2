import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { observeAudio, audioState } from '../helpers/sound-observer.mjs';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDoc, getDocs, deleteDoc } from 'firebase/firestore';

const config = JSON.parse(readFileSync(new URL('../../firebase-applet-config.json', import.meta.url), 'utf8'));

// Real Firebase sessions and deployed components, with explicitly seeded fictional
// completed profiles. This does not claim onboarding or real AI generation passed.
// Credentials stay in memory; screenshots crop only the atmosphere panel.
test('signed-in atmosphere settings persist across reload and isolate accounts', async ({ page }, testInfo) => {
  const app = initializeApp(config, `atmosphere-qa-${randomUUID()}`);
  const auth = getAuth(app);
  const db = getFirestore(app, config.firestoreDatabaseId);
  const accounts = [];
  const note = description => testInfo.annotations.push({ type: 'verified', description });
  async function provision() {
    const account = { email: `aim-atmosphere-qa-${randomUUID()}@example.com`, password: `AIM-${randomUUID()}-7z!` };
    try {
      const { user } = await createUserWithEmailAndPassword(auth, account.email, account.password);
      account.uid = user.uid;
      accounts.push(account); // Track immediately, even if the profile write fails.
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid, name: 'Sam Atmosphere Tester', email: account.email,
        location: '', timeZone: 'America/Chicago', desiredIdentity: 'Creative professional',
        coreMission: 'Make time for drawing', currentMonthlyIncome: 0, targetMonthlyIncome: 0,
        primaryObstacle: '', topSkills: [], coreValues: [], ninetyDayTrajectory: '',
        onboardingCompleted: true, firstRunGuideStep: 'done', createdAt: new Date().toISOString(),
      });
      // A harmless probe never writes a paid entitlement. If live rules still
      // allow any billing write, remove this probe and fail the verification.
      let denied = false;
      const probe = doc(db, 'users', user.uid, 'billing', 'qa-probe');
      try { await setDoc(probe, { qaProbe: true }); account.probeCreated = true; }
      catch (error) {
        if (error?.code !== 'permission-denied') throw error;
        denied = true;
      }
      if (!denied) {
        testInfo.annotations.push({ type: 'failed', description: 'Live billing-path probe was writable; verification fails and cleanup is required.' });
        await deleteDoc(probe);
        if ((await getDoc(probe)).exists()) throw new Error('Probe remains.');
        account.probeCreated = false;
        throw new Error('Live billing rules permit a client write.');
      }
      note('Live named-database rules reject owner billing writes: PASS');
    } catch { throw new Error('Disposable Firebase account/profile setup failed; credential details withheld.'); }
    return account;
  }
  async function signIn(account) {
    await expect(page.getByRole('button', { name: 'Get started', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Get started', exact: true }).click();
    await page.evaluate(({ email, password }) => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      for (const [type, value] of [['email', email], ['password', password]]) {
        const input = document.querySelector(`form input[type="${type}"]`);
        set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, { email: account.email, password: account.password });
    await page.locator('form').filter({ has: page.locator('input[type="email"]') }).locator('button[type="submit"]').click();
    await expect(page.locator('#nav-tab-settings')).toBeVisible({ timeout: 45000 });
    await page.locator('#nav-tab-settings').click();
    await expect(page.getByRole('region', { name: 'Personalize My Atmosphere' })).toBeVisible();
  }
  async function signOut() {
    await page.locator('#aim-account-btn').click();
    await page.getByRole('button', { name: 'Sign Out of Account', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Get started', exact: true })).toBeVisible();
  }
  try {
    await observeAudio(page);
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
    const first = await provision();
    const second = await provision();
    await signIn(first);
    const sound = page.getByRole('region', { name: 'Fractal Soundscapes' });
    await expect(sound.getByLabel('Sound mode')).toHaveValue('fractal');
    await expect(sound.getByLabel('Soundscape volume')).toHaveValue('25');
    await expect(sound.getByLabel('Session length')).toHaveValue('25');
    expect(await audioState(page)).toEqual([]);
    await sound.getByRole('button', { name: 'Play soundscape', exact: true }).click();
    await expect.poll(async () => (await audioState(page)).at(-1)?.rms).toBeGreaterThan(0.00001);
    await testInfo.attach('soundscape-settings-phone', {
      body: await sound.screenshot({ style: 'header, nav { opacity: 0 !important; }' }), contentType: 'image/png',
    });
    await page.locator('#nav-tab-home').click();
    await expect.poll(async () => (await audioState(page)).every(s => s.state === 'closed')).toBe(true);
    await page.locator('#nav-tab-settings').click();
    await expect(sound.getByRole('status')).toHaveText('Soundscape is off.');
    note('Deployed Settings: no autoplay, real sound samples after Play, navigation closes audio without restart: PASS');
    note('Real email sign-in, Firebase profile hydration and Settings navigation: PASS');
    const panel = page.getByRole('region', { name: 'Personalize My Atmosphere' });
    await expect(panel).toContainText('0 comparisons saved.');
    await panel.getByRole('button', { name: 'Choose A', exact: true }).click();
    await expect(panel).toContainText('1 comparisons saved.');
    await panel.getByRole('button', { name: 'Apply recommendation', exact: true }).click();
    await expect(panel).toContainText(/Applied: .*detail/);
    await panel.getByLabel('Color palette').selectOption('forest');
    await panel.getByRole('button', { name: 'Apply manual settings', exact: true }).click();
    await expect(panel).toContainText('Applied: forest');
    await page.reload();
    await expect(page.locator('#nav-tab-settings')).toBeVisible({ timeout: 45000 });
    await page.locator('#nav-tab-settings').click();
    await expect(panel).toContainText('Applied: forest');
    await expect(panel).toContainText('1 comparisons saved.');
    note('Calibration, recommendation, manual override and same-device reload persistence: PASS');
    for (const [name, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 900 }]]) {
      await page.setViewportSize(viewport);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await testInfo.attach(`atmosphere-${name}`, {
        body: await panel.screenshot({ style: '#aim-main-header, #aim-primary-nav { visibility: hidden !important; }' }),
        contentType: 'image/png',
      });
    }
    // Use the desktop account control for session switching; layout screenshots
    // above cover both widths without including any account information.
    await signOut();
    await signIn(second);
    await expect(panel).toContainText('0 comparisons saved.');
    await expect(panel).toContainText('Applied: None (default AIM appearance)');
    await signOut();
    await signIn(first);
    await expect(panel).toContainText('Applied: forest');
    await expect(panel).toContainText('1 comparisons saved.');
    note('Real sign-out/sign-in and per-account preference isolation: PASS');
    await panel.getByRole('button', { name: 'Reset calibration', exact: true }).click();
    await expect(panel).toContainText('0 comparisons saved.');
    await expect(panel).toContainText('Applied: forest');
    await panel.getByRole('button', { name: 'Delete profile', exact: true }).click();
    await panel.getByRole('button', { name: 'Confirm delete', exact: true }).click();
    await expect(panel).toContainText('Applied: None (default AIM appearance)');
    await page.reload();
    await expect(page.locator('#nav-tab-settings')).toBeVisible({ timeout: 45000 });
    await page.locator('#nav-tab-settings').click();
    await expect(panel).toContainText('Applied: None (default AIM appearance)');
    note('Reset retains the applied appearance; deletion survives reload: PASS');
  } finally {
    testInfo.setTimeout(testInfo.timeout + 90000);
    let cleanupFailed = false;
    for (const account of accounts) {
      try {
        const { user } = await signInWithEmailAndPassword(auth, account.email, account.password);
        if (user.uid !== account.uid) throw new Error();
        // Never delete the identity or claim cleanup if a created probe remains.
        if (account.probeCreated) {
          const probe = doc(db, 'users', user.uid, 'billing', 'qa-probe');
          await deleteDoc(probe);
          if ((await getDoc(probe)).exists()) throw new Error('Probe remains.');
          account.probeCreated = false;
        }
        for (const name of ['projects', 'schedules', 'goals', 'memories', 'wellness', 'life_updates', 'daily_plans', 'settings']) {
          const ref = collection(db, 'users', user.uid, name);
          for (const record of (await getDocs(ref)).docs) await deleteDoc(record.ref);
          if (!(await getDocs(ref)).empty) throw new Error();
        }
        await deleteDoc(doc(db, 'users', user.uid));
        await deleteUser(user);
        let rejected = false;
        try { await signInWithEmailAndPassword(auth, account.email, account.password); } catch { rejected = true; }
        if (!rejected) throw new Error();
      } catch { cleanupFailed = true; }
    }
    await deleteApp(app);
    if (cleanupFailed) throw new Error('Disposable atmosphere QA cleanup failed; owner review required.');
    if (accounts.length) note('Disposable Firebase data and identities deleted and deletion verified: PASS');
  }
});
