import { test, expect } from '@playwright/test';
import { VERIFIED_DFW_SEARCH_SUGGESTIONS as serverSuggestions } from '../../server/aimOsService.ts';

test('Scan Now retains every API career link and recovers from malformed responses', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let payload = { searchSuggestions: serverSuggestions, newListings: [], materialChanges: [], liveProviderConnected: false };
  await page.route('**/api/aim/jobs/scan', route => route.fulfill({ status: 200, json: payload }));
  await page.goto('/qa/scanner-harness/');
  const scan = page.getByRole('button', { name: 'Scan Now', exact: true });
  const links = page.getByRole('link', { name: 'Visit Career Portal', exact: true });
  await scan.click();
  await expect(links).toHaveCount(serverSuggestions.length);
  for (const suggestion of serverSuggestions) {
    await expect(page.locator('a').filter({ hasText: 'Visit Career Portal' }).and(page.locator('a[href="' + suggestion.directSearchUrl + '"]'))).toBeVisible();
  }
  await testInfo.attach('career-links-after-scan', { body: await page.locator('#opportunity-scanner-screen').screenshot(), contentType: 'image/png' });
  payload = { searchSuggestions: [null, {}, { title: {}, url: 'javascript:alert(1)' }], newListings: [] };
  await scan.click();
  await expect(links).toHaveCount(serverSuggestions.length);
  await expect(scan).toBeEnabled();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('non-JSON server failures retain career resources and allow another scan', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/aim/jobs/scan', route => route.fulfill({ status: 502, contentType: 'text/html', body: 'Gateway unavailable' }));
  await page.goto('/qa/scanner-harness/');
  const links = page.getByRole('link', { name: 'Visit Career Portal', exact: true });
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  const scan = page.getByRole('button', { name: 'Scan Now', exact: true });
  await scan.click();
  await expect(scan).toBeEnabled();
  await expect(links).toHaveCount(count);
  await scan.click();
  await expect(scan).toBeEnabled();
  expect(errors).toEqual([]);
});
