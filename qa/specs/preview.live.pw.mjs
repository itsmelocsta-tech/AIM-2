import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) return;
  const preview = new URL(process.env.AIM_PREVIEW_URL);
  if (preview.protocol !== 'https:' || !/^aim-2-[a-z0-9]+-itsmelocsta-5904\.vercel\.app$/.test(preview.hostname)) {
    throw new Error('BLOCKED: refuse automation access for an unverified preview origin.');
  }
  // Establish a host-scoped cookie without following redirects or forwarding the
  // secret to third-party resources. Browser/API requests share this context.
  try {
    const response = await page.request.get(new URL('/', preview.origin).href, {
      headers: { 'x-vercel-protection-bypass': secret, 'x-vercel-set-bypass-cookie': 'true' },
      maxRedirects: 0,
    });
    if (response.status() >= 400) throw new Error('access rejected');
  } catch {
    // Do not include Playwright's request log: it may contain secret headers.
    throw new Error('BLOCKED: authorized preview access could not be established.');
  }
});

async function requireAim(page) {
  const response = await page.goto('/');
  const protectedPage = /vercel\.com\/(?:login|sso)/.test(page.url()) || [401,403].includes(response?.status());
  if (protectedPage) throw new Error('BLOCKED: Vercel deployment protection requires authorized runner access; protection was preserved.');
  if (await page.getByText(/Log in to Vercel|Authentication Required/i).count()) {
    throw new Error('BLOCKED: Vercel sign-in wall prevents live AIM tests.');
  }
  return response;
}

test('exact-head deployed AIM renders its public phone entry and account controls', async ({ page }, testInfo) => {
  await requireAim(page);
  await expect(page.getByRole('heading', { name: 'Good day. I’m AIM.' })).toBeVisible();
  await page.getByRole('button', { name: 'Get started', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'AIM Account & Security' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // Only public UI: never capture a signed-in account, token, network trace, or storage state.
  await page.screenshot({ path: testInfo.outputPath('public-phone-entry.png') });
});

test('deployed API is healthy and rejects unauthenticated Premium operations', async ({ page }) => {
  await requireAim(page);
  const request = page.request;
  const health = await request.get('/api/health');
  expect(health.status(), 'Deployed /api/health status').toBe(200);
  expect((await health.json()).status).toBe('ok');
  for (const route of ['monetize', 'creative', 'life-update-analyze']) {
    const response = await request.post(`/api/aim/${route}`, { data: {} });
    expect(response.status(), `${route} must require Firebase authentication`).toBe(401);
  }
});

test('fresh user can make a plan, keep it after reload, save a personal search, and reroute it', async ({ page, request }, testInfo) => {
  let idToken;
  try {
    await requireAim(page);
    await page.getByRole('button', { name: 'Get started', exact: true }).click();
    const account = page.getByRole('heading', { name: 'AIM Account & Security' }).locator('xpath=../../..');
    await account.getByRole('button', { name: 'Create Account', exact: true }).click();
    const tag = crypto.randomUUID();
    await account.getByLabel('Email Address').fill(`aim-qa-${tag}@example.com`);
    await account.getByLabel('Password').fill(`AIM-QA-${tag}-7z!`);
    const signupResponse = page.waitForResponse(response => response.url().includes('identitytoolkit.googleapis.com') && response.url().includes('accounts:signUp'));
    await account.getByRole('button', { name: 'Create Isolated Account' }).click();
    const signup = await (await signupResponse).json();
    if (!signup.idToken) throw new Error('BLOCKED: Firebase did not return a test-account session.');
    idToken = signup.idToken;

    await expect(page.locator('#aim-current-state-textarea')).toBeVisible({ timeout: 30000 });
    await page.locator('#aim-current-state-textarea').fill('I am starting an illustration business and need steady work with illustration clients. I also want to sleep better.');
    await page.getByRole('button', { name: /Next: What you want to change/ }).click();
    await page.locator('#aim-changes-wanted-textarea').fill('I have two hours available today and want a small, clear plan.');
    await page.getByRole('button', { name: /Next: Who you want to be/ }).click();
    await page.locator('#aim-desired-state-textarea').fill('I want to earn a steady living as an illustrator.');
    await page.getByRole('button', { name: 'Build my starting plan' }).click();
    await expect(page.locator('#aim-pathway-selection-module')).toBeVisible({ timeout: 90000 });
    await expect(page.locator('#aim-pathway-selection-module').locator('[id^="pathway-card-"]')).toHaveCount(3);
    await page.getByRole('button', { name: 'Use this plan' }).first().click();
    await expect(page.getByText('Getting started · 1 of 3')).toBeVisible({ timeout: 45000 });

    // Drop the browser cache. The profile and starting plan must hydrate from Firebase.
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText('Getting started · 1 of 3')).toBeVisible({ timeout: 45000 });
    await page.getByRole('button', { name: 'Show me today’s plan' }).click();
    await expect(page.getByText('Getting started · 2 of 3')).toBeVisible();
    await page.getByRole('button', { name: 'Show me how to update AIM' }).click();
    await page.getByRole('button', { name: 'Finish and go to Today' }).click();

    await page.locator('#nav-tab-planner').click();
    await expect(page.locator('#daily-planner-module')).toContainText('Available Productive Hours: 2 hrs');
    await page.getByRole('button', { name: 'Today' }).click();

    await expect(page.locator('#nav-tab-scanner')).toBeVisible();
    await expect(page.locator('#nav-tab-scanner')).toHaveText('Your Opportunities');
    await page.locator('#nav-tab-scanner').click();
    await expect(page.getByRole('heading', { name: 'Your Opportunities' })).toBeVisible();
    await page.locator('select').selectOption('creative');
    const setup = page.locator('#opportunity-scanner-setup');
    await setup.locator('textarea').fill('Illustration clients');
    await setup.locator('input').fill('Austin');
    await setup.locator('#save-opportunity-focus-btn').click();
    await expect(page.getByText('Looking for: Illustration clients')).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('aim_personal_operating_context_v1'))).toContain('opportunityFocus');
    await page.reload();
    await expect(page.locator('#nav-tab-scanner')).toHaveText('Your Opportunities');
    await page.locator('#nav-tab-scanner').click();
    await expect(page.getByRole('heading', { name: 'Your Opportunities' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open your opportunity search' })).toHaveAttribute('href', 'https://www.google.com/search?q=Illustration%20clients%20Austin');
    await expect(page.getByText(/Fort Worth|DFW|driver jobs/i)).toHaveCount(0);

    await page.getByRole('button', { name: 'Today' }).click();
    await page.getByRole('button', { name: 'Update my plan' }).click();
    await page.locator('#life-update-textarea').fill('I only have one hour available today, not two. Shorten my plan to fit one hour.');
    await page.locator('#life-update-submit-btn').click();
    await expect(page.locator('#btn-confirm-reroute')).toBeVisible({ timeout: 60000 });
    await page.locator('#btn-confirm-reroute').click();
    await expect(page.locator('#aim-rerouted-success-card')).toBeVisible({ timeout: 45000 });
    await page.locator('#nav-tab-planner').click();
    await expect(page.locator('#daily-planner-module')).toContainText('Available Productive Hours: 1 hrs');
    await expect(page.locator('#nav-tab-wellness')).toBeVisible();
  } finally {
    // The test removes only the disposable account it just created. Keep the ID token in memory only.
    if (idToken) {
      const deleted = await request.delete(new URL('/api/aim/account', testInfo.project.use.baseURL || process.env.AIM_PREVIEW_URL).href, {
        headers: { Authorization: `Bearer ${idToken}` },
        data: { confirmed: true },
      });
      if (deleted.status() !== 200 && testInfo.errors.length === 0) {
        throw new Error(`Disposable QA account cleanup failed with HTTP ${deleted.status()}.`);
      }
    }
  }
});
