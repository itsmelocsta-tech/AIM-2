import { test, expect } from '@playwright/test';

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
  const response = await page.goto('/atmosphere-preview');
  if ([401, 403].includes(response?.status()) || /vercel\.com\/(?:login|sso)/.test(page.url())) throw new Error('BLOCKED: Vercel deployment protection requires authorized runner access.');
});

test('describe, adjust, remember and forget without saving or sending the description', async ({ page }, testInfo) => {
  const sent = [];
  page.on('request', request => { if (request.postData()) sent.push(request.postData()); });
  await page.getByLabel('What do you need right now?').fill('PRIVATE_MARKER: overwhelmed and need to write');
  await page.getByRole('button', { name: 'Shape my atmosphere' }).click();
  await expect(page.getByTestId('atmosphere-scene')).toHaveAttribute('data-palette', 'lagoon');
  await page.getByLabel('Palette', { exact: true }).selectOption('forest');
  await page.getByLabel('Geometry').selectOption('branches');
  await page.getByLabel('Visual intensity').fill('35');
  await page.getByRole('button', { name: 'This works for me' }).click();
  await page.getByRole('button', { name: 'Focus', exact: true }).click();
  await page.getByRole('button', { name: 'Settle', exact: true }).click();
  await expect(page.getByLabel('Palette', { exact: true })).toHaveValue('forest');
  await expect(page.getByLabel('Visual intensity')).toHaveValue('35');
  const stored = await page.evaluate(() => localStorage.getItem('aim.atmosphere.v1:public-preview'));
  expect(stored).not.toContain('PRIVATE_MARKER');
  expect(sent.join('')).not.toContain('PRIVATE_MARKER');
  await page.reload();
  await expect(page.getByLabel('What do you need right now?')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Settle', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Visual intensity')).toHaveValue('35');
  await expect(page.getByRole('button', { name: 'Start sound', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Too much', exact: true }).click();
  await expect(page.getByLabel('Visual intensity')).toHaveValue('25');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('adaptive-atmosphere.png'), fullPage: true });
  await page.getByRole('button', { name: 'Forget my atmosphere preferences' }).click();
  expect(await page.evaluate(() => localStorage.getItem('aim.atmosphere.v1:public-preview'))).toBeNull();
  await expect(page.getByLabel('Palette', { exact: true })).toHaveValue('amethyst');
});

test('motion respects accessibility and sound requires an explicit click', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Energize', exact: true }).click();
  await expect(page.getByTestId('atmosphere-scene')).toHaveAttribute('data-motion', 'still');
  await expect(page.getByRole('button', { name: 'Reduced motion active' })).toBeDisabled();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByTestId('atmosphere-scene')).toHaveAttribute('data-motion', 'moving');
  await page.getByRole('button', { name: 'Pause motion' }).click();
  await expect(page.getByTestId('atmosphere-scene')).toHaveAttribute('data-motion', 'still');
  await page.getByRole('button', { name: 'Start sound', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop sound', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Crystal Lab', exact: true }).click();
  await page.getByRole('button', { name: 'Atmosphere', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start sound', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('primary research includes measured outcomes and limits for all five topics', async ({ page }) => {
  await page.getByText('The research behind the questions', { exact: true }).click();
  const studies = page.locator('.atmosphere-studies article');
  await expect(studies).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    await expect(studies.nth(i)).toContainText('Limit:');
    await expect(studies.nth(i).getByRole('link')).toHaveAttribute('href', /^https:\/\/doi.org\/10\./);
  }
  await expect(page.getByText('Quantity perception does not show', { exact: false })).toBeVisible();
});

test('preference identities remain isolated and account changes stop sound', async ({ page }) => {
  test.skip(Boolean(process.env.AIM_PREVIEW_URL), 'Local fictional identity fixture; live Firebase account flow is not claimed.');
  await page.goto('/qa/dashboard-harness/');
  await page.getByRole('button', { name: 'Atmosphere', exact: true }).click();
  await page.getByLabel('Palette', { exact: true }).selectOption('ember');
  await page.getByLabel('What do you need right now?').fill('Private fixture text');
  await page.getByRole('button', { name: 'Start sound', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop sound', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch fixture account' }).click();
  await page.getByRole('button', { name: 'Atmosphere', exact: true }).click();
  await expect(page.getByLabel('Palette', { exact: true })).toHaveValue('amethyst');
  await expect(page.getByLabel('What do you need right now?')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Start sound', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch fixture account' }).click();
  await page.getByRole('button', { name: 'Atmosphere', exact: true }).click();
  await expect(page.getByLabel('Palette', { exact: true })).toHaveValue('ember');
});

test('unavailable storage and audio show honest recovery while visuals remain usable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error('Storage blocked for test'); };
    Object.defineProperty(window, 'AudioContext', { value: undefined, configurable: true });
  });
  await page.reload();
  await page.getByLabel('Palette', { exact: true }).selectOption('lagoon');
  await expect(page.getByTestId('atmosphere-scene')).toHaveAttribute('data-palette', 'lagoon');
  await expect(page.getByRole('alert')).toContainText('could not save');
  await page.getByRole('button', { name: 'This works for me' }).click();
  await expect(page.getByRole('status')).toContainText('Saving is unavailable.');
  await page.getByRole('button', { name: 'Start sound', exact: true }).click();
  await expect(page.getByText('Sound could not start in this browser.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start sound', exact: true })).toBeVisible();
});
