import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) return;
  const preview = new URL(process.env.AIM_PREVIEW_URL);
  if (preview.protocol !== 'https:' || !/^aim-2-[a-z0-9]+-itsmelocsta-5904\.vercel\.app$/.test(preview.hostname)) {
    throw new Error('BLOCKED: refuse automation access for an unverified preview origin.');
  }
  // Exchange the existing Actions secret for a host-scoped cookie. Never attach
  // a secret to browser-wide headers or follow a credential-bearing redirect.
  try {
    const response = await page.request.get(new URL('/', preview.origin).href, {
      headers: { 'x-vercel-protection-bypass': secret, 'x-vercel-set-bypass-cookie': 'true' },
      maxRedirects: 0,
    });
    if (response.status() >= 400) throw new Error('access rejected');
  } catch {
    // Playwright request errors may contain secret headers; publish only this.
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

for (const [name, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1366, height: 768 }]]) {
  test(`duplicate-email signup gives usable recovery on ${name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    // Exercise the actual Firebase client and auth UI with an isolated server
    // error; do not create an account or disclose whether a real email exists.
    await page.route('https://identitytoolkit.googleapis.com/v1/accounts:signUp*', route => route.fulfill({
      status: 400,
      json: { error: { code: 400, message: 'EMAIL_EXISTS', errors: [{ message: 'EMAIL_EXISTS', domain: 'global', reason: 'invalid' }] } },
    }));
    await requireAim(page);
    await page.getByRole('button', { name: 'Get started', exact: true }).click();
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();
    await page.locator('input[type="email"]').fill('fictional-duplicate@example.com');
    await page.locator('input[type="password"]').fill('Fictional-test-only-9!');
    await page.getByRole('button', { name: 'Create Isolated Account', exact: true }).click();
    const error = page.getByText('This email already has an AIM account. Choose Sign In to continue.', { exact: true });
    await expect(error).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await testInfo.attach(`signup-recovery-${name}`, { body: await error.screenshot(), contentType: 'image/png' });
    await page.getByRole('button', { name: 'Sign In', exact: true }).first().click();
    await expect(page.locator('input[type="email"]')).toHaveValue('fictional-duplicate@example.com');
    await expect(page.getByRole('button', { name: 'Sign In', exact: true }).last()).toBeEnabled();
  });
}
