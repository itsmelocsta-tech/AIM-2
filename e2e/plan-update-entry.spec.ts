import { expect, test } from '@playwright/test';

test('Today offers a direct plan update without a Premium dialog', async ({ page }) => {
  await page.goto('/e2e/harness/?plan-update');
  await expect(page.getByRole('button', { name: 'Update my plan' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Update my plan' }).click();
  await expect(page.getByRole('heading', { name: 'What changed?' })).toBeVisible();
  await expect(page.locator('#life-update-textarea')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Unlock AIM Premium' })).toHaveCount(0);
});
