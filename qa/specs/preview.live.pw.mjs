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
