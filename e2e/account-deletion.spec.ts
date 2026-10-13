import { expect, test } from '@playwright/test';

test('the web deletion page explains permanent removal and requires sign-in', async ({ page }) => {
  await page.goto('/e2e/harness/?delete-account');
  await expect(page.getByRole('heading', { name: 'Delete your AIM account' })).toBeVisible();
  await expect(page.getByText(/You cannot undo it/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Manage or cancel your Google Play subscription' })).toHaveAttribute('href', 'https://play.google.com/store/account/subscriptions');
  await expect(page.getByRole('button', { name: 'Permanently delete my AIM account' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign in to request deletion' }).click();
  await expect(page.getByRole('heading', { name: 'AIM Account & Security' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
