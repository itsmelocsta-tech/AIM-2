import { test, expect } from '@playwright/test';

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

test('deployed API is healthy and rejects unauthenticated Premium operations', async ({ page, request }) => {
  await requireAim(page);
  const health = await request.get('/api/health');
  expect(health.status(), 'Deployed /api/health status').toBe(200);
  expect((await health.json()).status).toBe('ok');
  for (const route of ['monetize', 'creative', 'life-update-analyze']) {
    const response = await request.post(`/api/aim/${route}`, { data: {} });
    expect(response.status(), `${route} must require Firebase authentication`).toBe(401);
  }
});
