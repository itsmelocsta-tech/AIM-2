import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (process.env.AIM_PREVIEW_URL && secret) {
    const preview = new URL(process.env.AIM_PREVIEW_URL);
    if (preview.protocol !== 'https:' || !/^aim-2-[a-z0-9]+-itsmelocsta-5904\.vercel\.app$/.test(preview.hostname)) throw new Error('BLOCKED: unverified preview origin.');
    try {
      const response = await page.request.get(preview.origin, { headers: { 'x-vercel-protection-bypass': secret, 'x-vercel-set-bypass-cookie': 'true' }, maxRedirects: 0 });
      if (response.status() >= 400) throw new Error('access rejected');
    } catch { throw new Error('BLOCKED: authorized preview access could not be established.'); }
  }
  const response = await page.goto('/dashboard-preview');
  if ([401, 403].includes(response?.status()) || /vercel\.com\/(?:login|sso)/.test(page.url())) throw new Error('BLOCKED: Vercel deployment protection requires authorized runner access.');
});

test('actual logo and API-backed graph render within the viewport', async ({ page }, testInfo) => {
  const logo = page.getByRole('img', { name: 'AIM orbital arrow logo' });
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate(img => img.complete && img.naturalWidth === 1254), { timeout: 15000 }).toBe(true);
  await expect(page.getByTestId('energy-check')).toBeVisible();
  await expect(page.getByRole('img', { name: /Reflection versus wavelength/ })).toBeVisible();
  await expect(page.getByText('Interactive dashboard preview · no account data')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open my AIM' })).toHaveAttribute('href', '/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('crystal-dashboard.png'), fullPage: true });
});

test('material edits, cavity and periodic comparison recalculate real curves', async ({ page }) => {
  await expect(page.getByTestId('energy-check')).toBeVisible();
  const original = await page.getByTestId('fibonacci-curve').getAttribute('d');
  await page.getByLabel('Material preset').selectOption('contrast');
  await expect(page.getByRole('status')).toHaveText('Settings changed. Run comparison to calculate the new spectrum.');
  await page.getByRole('spinbutton', { name: 'Air cavity (nm; 0 = off)', exact: true }).fill('200');
  await page.getByLabel('Compare Fibonacci with').selectOption('periodic');
  const response = page.waitForResponse(r => r.url().endsWith('/api/optics/compare') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Run comparison' }).click();
  const data = await (await response).json();
  expect(data.settings).toMatchObject({ nA: 2.35, nB: 1.45, defectNm: 200, control: 'periodic' });
  expect(data.fibonacci.sequence).toContain('D');
  expect(data.energyError).toBeLessThan(1e-10);
  await expect(page.getByTestId('fibonacci-curve')).not.toHaveAttribute('d', original);
  await page.getByRole('button', { name: 'Transmission', exact: true }).click();
  await expect(page.getByRole('img', { name: /Transmission versus wavelength/ })).toBeVisible();
  await page.getByLabel('Inspect wavelength').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('552 nm', { exact: true })).toBeVisible();
});

test('CSV contains calculated samples; reset restores baseline inputs', async ({ page }) => {
  await expect(page.getByTestId('energy-check')).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('aim-layer-order-spectrum.csv');
  const csv = await fs.readFile(await download.path(), 'utf8');
  expect(csv).toContain('wavelength_nm,fibonacci_R,fibonacci_T');
  expect(csv.trim().split('\n')).toHaveLength(204);
  await page.getByLabel('A thickness (nm)', { exact: true }).fill('200');
  await page.getByRole('button', { name: 'Reset experiment' }).click();
  await expect(page.getByLabel('A thickness (nm)', { exact: true })).toHaveValue('90');
  await expect(page.getByTestId('energy-check')).toBeVisible();
});

test('failed API shows an error and retry recovers without fabricated curves', async ({ page }) => {
  await expect(page.getByTestId('energy-check')).toBeVisible();
  await page.route('**/api/optics/compare', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Lab temporarily unavailable"}' }));
  await page.getByRole('button', { name: 'Run comparison' }).click();
  await expect(page.getByRole('alert')).toContainText('Lab temporarily unavailable');
  await expect(page.getByTestId('fibonacci-curve')).toHaveCount(0);
  await page.unroute('**/api/optics/compare');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByTestId('energy-check')).toBeVisible();
});

test('server rejects invalid settings while private AIM routes stay authenticated', async ({ page }) => {
  const invalid = await page.request.post('/api/optics/compare', { data: { nA: 1, layerCount: 1000000 } });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).error).toBeTruthy();
  const privateRoute = await page.request.post('/api/aim/plan', { data: {} });
  expect(privateRoute.status()).toBe(401);
});

test('My day renders supplied saved state, updates counts and preserves planner navigation', async ({ page }) => {
  test.skip(Boolean(process.env.AIM_PREVIEW_URL), 'Component fixture is local only; no deployed account PASS is claimed.');
  await page.goto('/qa/dashboard-harness/');
  const summary = page.getByLabel('Your saved day');
  await expect(summary).toContainText('1 / 2 complete');
  await page.getByRole('button', { name: 'Complete fixture task' }).click();
  await expect(summary).toContainText('2 / 2 complete');
  await summary.getByRole('button', { name: 'Open today’s plan' }).click();
  await expect(page.getByLabel('Navigation destination')).toHaveText('planner');
  await page.getByRole('button', { name: 'Crystal Lab', exact: true }).click();
  await expect(page.getByTestId('energy-check')).toBeVisible();
  await page.getByRole('button', { name: 'My day', exact: true }).click();
  await expect(summary).toContainText('2 / 2 complete');
});
