import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/qa/harness/'); });

test('Basic upgrade shows honest pricing, preserves access, and disables unverified billing', async ({ page }) => {
  await expect(page.getByLabel('Premium access')).toHaveText('denied');
  await page.getByRole('button', { name: 'Review Premium' }).click();
  const dialog = page.getByRole('dialog', { name: 'Unlock AIM Premium' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('$9.99/month');
  await expect(dialog).toContainText('$79.99/year');
  await expect(dialog).toContainText('AIM keeps your data on Basic');
  await expect(dialog.getByRole('button', { name: /Start 7-day trial/ })).toBeDisabled();
  const close = dialog.getByRole('button', { name: 'Close AIM Premium details' });
  const bounds = await close.boundingBox();
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  await close.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
});

test('active and live trial grant access; expired trial returns to Basic access', async ({ page }) => {
  for (const state of ['active', 'trial', 'expired', 'basic']) {
    await page.getByLabel('Entitlement fixture').selectOption(state);
    await expect(page.getByLabel('Premium access')).toHaveText(['active', 'trial'].includes(state) ? 'granted' : 'denied');
  }
});

test('upgrade content and close control stay within a phone or desktop viewport', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: 'Review Premium' }).click();
  const dialog = page.getByRole('dialog');
  const bounds = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('premium-component.png') });
});
