import { expect, test } from '@playwright/test';

test('a personal job focus keeps the entered description and city in search links', async ({ page }, testInfo) => {
  await page.goto('/e2e/harness/?opportunities');
  await page.locator('select').selectOption('jobs');
  await page.locator('textarea').fill('Graphic design jobs');
  await page.locator('input').fill('Austin');
  await page.locator('#save-opportunity-focus-btn').click();
  await expect(page.getByRole('heading', { name: 'Your Opportunities' })).toBeVisible();
  await expect(page.getByText('Looking for: Graphic design jobs')).toBeVisible();
  const queryLink = page.locator('a[href^="https://www.google.com/search?q="]');
  await expect(queryLink).toHaveAttribute('href', 'https://www.google.com/search?q=Graphic%20design%20jobs%20Austin');
  await expect(page.getByText(/Fort Worth|DFW/)).toHaveCount(0);
  await page.reload();
  await expect(queryLink).toHaveAttribute('href', 'https://www.google.com/search?q=Graphic%20design%20jobs%20Austin');
  await page.screenshot({ path: testInfo.outputPath('personal-job-focus.png'), fullPage: true });
});

test('a creative focus offers its own search without driver jobs', async ({ page }) => {
  await page.goto('/e2e/harness/?opportunities');
  await page.locator('select').selectOption('creative');
  await page.locator('textarea').fill('Local illustration clients');
  await page.locator('input').fill('Austin');
  await page.locator('#save-opportunity-focus-btn').click();
  await expect(page.getByRole('heading', { name: 'Your Opportunities' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open your opportunity search' })).toHaveAttribute('href', 'https://www.google.com/search?q=Local%20illustration%20clients%20Austin');
  await expect(page.getByText(/Fort Worth|DFW|company.vehicle driver/i)).toHaveCount(0);
});
