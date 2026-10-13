import { test, expect } from '@playwright/test';
test('Basic user opens saved wellness through real App navigation and saves after reload', async ({ page }, testInfo) => {
  // No real account, Firestore, Gemini, or external API is used in this regression.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' && !url.pathname.startsWith('/api/')
      ? route.continue() : route.abort();
  });
  await page.goto('/qa/wellness-harness/');
  await page.getByRole('button', { name: 'Agree and continue' }).click();
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

test('delayed guide saves finish before navigation and do not send the user back home', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' && !new URL(route.request().url()).pathname.startsWith('/api/') ? route.continue() : route.abort());
  await page.goto('/qa/wellness-harness/?slow-guide');
  await page.getByRole('button', { name: 'Agree and continue' }).click();
  await page.getByRole('button', { name: 'Show me today’s plan' }).click();
  await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await page.getByRole('button', { name: 'Show me how to update AIM' }).click();
  await page.getByRole('button', { name: 'Finish and go to Today' }).click();
  await expect(page.getByText(/Getting started · \d of 3/)).toHaveCount(0);
  await page.locator('#nav-tab-wellness').click();
  await expect(page.locator('#wellness-engine-module')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fictional-profile'))?.firstRunGuideStep)).toBe('done');
  await page.reload();
  await expect(page.getByText(/Getting started · \d of 3/)).toHaveCount(0);
  await page.locator('#nav-tab-wellness').click();
  await expect(page.locator('#wellness-engine-module')).toBeVisible();
});
