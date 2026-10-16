import { test, expect } from '@playwright/test';
test('Basic user opens saved wellness through real App navigation and saves after reload', async ({ page }, testInfo) => {
  // No real account, Firestore, Gemini, or external API is used in this regression.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' && !url.pathname.startsWith('/api/')
      ? route.continue() : route.abort();
  });
  await page.goto('/qa/wellness-harness/');
  await page.locator('#nav-tab-wellness').click();
  await expect(page.locator('#wellness-engine-module')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Unlock AIM Premium' })).toBeHidden();
  await expect(page.locator('#wellness-engine-module textarea')).toHaveValue('Fictional saved wellness note');
  await page.locator('#wellness-engine-module textarea').fill('Fictional updated note');
  await page.getByRole('button', { name: 'Update Vitality Log' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fictional-wellness'))?.[0]?.notes)).toBe('Fictional updated note');
  await page.reload();
  await page.locator('#nav-tab-wellness').click();
  await expect(page.locator('#wellness-engine-module textarea')).toHaveValue('Fictional updated note');
  await page.screenshot({ path: testInfo.outputPath('basic-saved-wellness.png') });
  // Premium computation remains gated.
  await page.locator('#nav-tab-home').click();
  await page.getByRole('button', { name: 'Your Coaches', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Unlock AIM Premium' })).toBeVisible();
});
