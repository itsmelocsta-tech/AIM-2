import { test, expect } from '@playwright/test';

import { observeAudio, audioState } from '../helpers/sound-observer.mjs';

test.beforeEach(async ({ page }) => { await observeAudio(page); await page.goto('/qa/harness/soundscapes.html'); });

test('real fractal and ambient output, volume, silence and persisted settings', async ({ page }, testInfo) => {
  const panel = page.getByRole('region', { name: 'Fractal Soundscapes' });
  await expect(panel.getByLabel('Sound mode')).toHaveValue('fractal');
  await expect(panel.getByLabel('Soundscape volume')).toHaveValue('25');
  await expect(panel.getByLabel('Session length')).toHaveValue('25');
  expect(await audioState(page)).toEqual([]); // Never autoplay.
  await panel.getByRole('button', { name: 'Play soundscape', exact: true }).click();
  await expect.poll(async () => (await audioState(page))[0]?.rms).toBeGreaterThan(0.00001);
  expect((await audioState(page))[0]).toMatchObject({ state: 'running', oscillators: 16 });
  await panel.getByLabel('Soundscape volume').fill('0');
  await expect.poll(async () => (await audioState(page))[0]?.rms).toBeLessThan(0.00001);
  await panel.getByLabel('Soundscape volume').fill('40');
  await expect.poll(async () => (await audioState(page))[0]?.rms).toBeGreaterThan(0.00001);
  await panel.getByLabel('Sound mode').selectOption('ambient');
  await expect.poll(async () => (await audioState(page))[0]?.state).toBe('closed');
  await panel.getByRole('button', { name: 'Play soundscape', exact: true }).click();
  await expect.poll(async () => (await audioState(page))[1]?.rms).toBeGreaterThan(0.00001);
  expect((await audioState(page))[1].oscillators).toBe(4);
  await panel.getByRole('button', { name: 'Stop soundscape', exact: true }).click();
  await expect.poll(async () => (await audioState(page))[1]?.state).toBe('closed');
  await panel.getByLabel('Sound mode').selectOption('silence');
  await expect(panel.getByRole('button', { name: 'Play soundscape', exact: true })).toBeDisabled();
  await page.reload();
  await expect(panel.getByLabel('Sound mode')).toHaveValue('silence');
  await expect(panel.getByLabel('Soundscape volume')).toHaveValue('40');
  expect(await audioState(page)).toEqual([]);
  await testInfo.attach('soundscape-controls', { body: await panel.screenshot(), contentType: 'image/png' });
});

test('silence, cancellation and leaving Settings invalidate pending resume', async ({ page }) => {
  const panel = page.getByRole('region', { name: 'Fractal Soundscapes' });
  for (const action of ['silence', 'cancel', 'unmount']) {
    await page.evaluate(() => { window.__soundQA.delayResume = true; });
    await panel.getByLabel('Sound mode').selectOption('fractal');
    await panel.getByRole('button', { name: 'Play soundscape', exact: true }).click();
    await expect(panel.getByRole('button', { name: 'Cancel starting soundscape' })).toBeVisible();
    if (action === 'silence') await panel.getByLabel('Sound mode').selectOption('silence');
    else if (action === 'cancel') await panel.getByRole('button', { name: 'Cancel starting soundscape' }).click();
    else await page.getByRole('button', { name: 'Leave Settings' }).click();
    await page.evaluate(() => { window.__soundQA.delayResume = false; window.__soundQA.releases.splice(0).forEach(resolve => resolve()); });
    await expect.poll(async () => (await audioState(page)).every(s => s.state === 'closed' && s.oscillators === 0)).toBe(true);
    if (action === 'unmount') await page.getByRole('button', { name: 'Open Settings' }).click();
    await expect(panel.getByRole('status')).toHaveText('Soundscape is off.');
  }
});

test('25 minute timer and pagehide stop output without auto-restart', async ({ page }) => {
  const panel = page.getByRole('region', { name: 'Fractal Soundscapes' });
  await page.clock.install();
  await panel.getByRole('button', { name: 'Play soundscape', exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText('Soundscape is playing.');
  await page.clock.fastForward(25 * 60_000);
  await expect(panel.getByRole('status')).toHaveText('Soundscape is off.');
  await expect.poll(async () => (await audioState(page))[0]?.state).toBe('closed');
  await panel.getByRole('button', { name: 'Play soundscape', exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText('Soundscape is playing.');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(panel.getByRole('status')).toHaveText('Soundscape is off.');
  await expect.poll(async () => (await audioState(page)).every(s => s.state === 'closed')).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow')));
  await expect(panel.getByRole('status')).toHaveText('Soundscape is off.');
});
