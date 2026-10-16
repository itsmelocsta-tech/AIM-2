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
  await expect(page.locator('.atmosphere-art')).toHaveCSS('animation-name', 'none');
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

test('primary research includes measured outcomes and limits for all nine topics', async ({ page }, testInfo) => {
  await page.locator('.atmosphere-research summary').click();
  const studies = page.locator('.atmosphere-studies article');
  await expect(studies).toHaveCount(9);
  for (let i = 0; i < 9; i++) {
    await expect(studies.nth(i)).toContainText('Limit:');
    await expect(studies.nth(i).getByRole('link')).toHaveAttribute('href', /^https:\/\/doi.org\/10\./);
  }
  await expect(page.getByText('Quantity perception does not show', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByText('Detail & engagement', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('research-guide.png') });
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
  await expect(page.locator('.atmosphere-status')).toContainText('Saving is unavailable.');
  await page.getByRole('button', { name: 'Start sound', exact: true }).click();
  await expect(page.getByText('Sound could not start in this browser.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start sound', exact: true })).toBeVisible();
});

test('organic geometry, saturation and gentle drift remain independent and remember choices', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: 'Focus', exact: true }).click();
  await expect(page.getByTestId('atmosphere-scene')).toHaveAttribute('data-shape', 'contours');
  const initial = await page.locator('.atmosphere-geometry path').first().getAttribute('d');
  await page.getByLabel('Color saturation', { exact: true }).fill('15');
  await page.getByLabel('Pattern density', { exact: true }).fill('5');
  await expect(page.locator('.atmosphere-geometry path')).toHaveCount(16);
  await expect(page.locator('.atmosphere-geometry path').last()).not.toHaveAttribute('d', initial);
  await expect(page.locator('.atmosphere-art')).toHaveCSS('filter', 'saturate(0.15)');
  await expect(page.locator('.atmosphere-motion')).toHaveCSS('animation-name', 'atmosphere-float');
  const duration = await page.locator('.atmosphere-motion').evaluate(el => parseFloat(getComputedStyle(el).animationDuration));
  expect(duration).toBeGreaterThanOrEqual(120);
  await page.getByRole('button', { name: 'Pause motion' }).click();
  await expect(page.locator('.atmosphere-art')).toHaveCSS('animation-play-state', 'paused');
  await page.getByLabel('Sound brightness', { exact: true }).fill('25');
  await page.reload();
  await expect(page.getByLabel('Color saturation', { exact: true })).toHaveValue('15');
  await expect(page.getByLabel('Sound brightness', { exact: true })).toHaveValue('25');
  await expect(page.getByRole('button', { name: 'Start sound', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Pattern density', { exact: true }).fill('3');
  await page.getByLabel('Color saturation', { exact: true }).fill('60');
  await page.screenshot({ path: testInfo.outputPath('research-refined-atmosphere.png'), fullPage: true });
});

test('each sound can start, change tone and volume, and close after its manual fade', async ({ page }) => {
  await page.evaluate(() => {
    const Native = window.AudioContext;
    window.__qaAudioContexts = [];
    window.AudioContext = class extends Native { constructor(...args) { super(...args); window.__qaAudioContexts.push(this); } };
  });
  for (const kind of ['pink', 'rain', 'drone']) {
    await page.getByLabel('Optional sound', { exact: true }).selectOption(kind);
    await page.getByRole('button', { name: 'Start sound', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Stop sound', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Sound brightness', { exact: true }).fill('70');
    await page.getByLabel('Sound volume', { exact: true }).fill('20');
    await page.getByRole('button', { name: 'Stop sound', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__qaAudioContexts.every(context => context.state === 'closed'))).toBe(true);
  }
});

test('offline rendering checks real graph clipping, fade envelopes, silence and tone response', async ({ page }, testInfo) => {
  test.skip(Boolean(process.env.AIM_PREVIEW_URL), 'Local module render verifies signal engineering; it does not verify perceived sound quality or mood.');
  const stats = await page.evaluate(async () => {
    const { createAmbientGraph } = await import('/src/atmosphere/audioEngine.ts');
    const { volumeGain } = await import('/src/atmosphere/audioDSP.ts');
    const { presets } = await import('/src/atmosphere/settings.ts');
    async function render(kind, tone, volume = 50) {
      const rate = 16000, context = new OfflineAudioContext(2, rate * 4, rate);
      const graph = createAmbientGraph(context, { ...presets.focus, sound: kind, tone });
      graph.output.gain.setValueAtTime(0, 0);
      graph.output.gain.linearRampToValueAtTime(volumeGain(volume), .45);
      graph.output.gain.setValueAtTime(volumeGain(volume), 3.5);
      graph.output.gain.linearRampToValueAtTime(0, 3.62);
      const result = await context.startRendering();
      const samples = result.getChannelData(0);
      const rms = (start, end) => Math.sqrt(samples.slice(Math.round(start * rate), Math.round(end * rate)).reduce((s, v) => s + v * v, 0) / Math.round((end - start) * rate));
      let peak = 0; for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
      graph.dispose();
      return { peak, body: rms(1, 3), entrance: rms(0, .015), exit: rms(3.8, 4) };
    }
    return { sounds: await Promise.all(['pink', 'rain', 'drone'].map(kind => render(kind, 40))), dark: await render('pink', 0), bright: await render('pink', 100), silent: await render('drone', 40, 0) };
  });
  await testInfo.attach('offline-audio-metrics.json', { body: JSON.stringify(stats, null, 2), contentType: 'application/json' });
  for (const sound of stats.sounds) {
    expect(sound.peak).toBeLessThan(.5); expect(sound.body).toBeGreaterThan(.001);
    expect(sound.entrance).toBeLessThan(sound.body * .2); expect(sound.exit).toBeLessThan(1e-7);
  }
  expect(Math.max(...stats.sounds.map(s => s.body)) / Math.min(...stats.sounds.map(s => s.body))).toBeLessThan(2.5);
  expect(stats.bright.body).toBeGreaterThan(stats.dark.body * 1.1);
  expect(stats.silent.peak).toBe(0);
});

test('older saved choices survive the upgrade and refined defaults can be tried without losing them', async ({ page }) => {
  await page.evaluate(() => {
    const old = { palette: 'forest', shape: 'rings', intensity: 35, density: 2, motion: 0, volume: 7, sound: 'rain' };
    localStorage.setItem('aim.atmosphere.v1:public-preview', JSON.stringify({ version: 1, intent: 'focus', current: old, learned: { focus: old } }));
  });
  await page.reload();
  await expect(page.getByLabel('Geometry', { exact: true })).toHaveValue('rings');
  await expect(page.getByLabel('Color saturation', { exact: true })).toHaveValue('50');
  await expect(page.getByLabel('Sound brightness', { exact: true })).toHaveValue('40');
  await page.getByRole('button', { name: 'Try refined defaults', exact: true }).click();
  await expect(page.getByLabel('Geometry', { exact: true })).toHaveValue('contours');
  await page.getByRole('button', { name: 'Focus', exact: true }).click();
  await expect(page.getByLabel('Geometry', { exact: true })).toHaveValue('rings');
  await page.getByRole('button', { name: 'Try refined defaults', exact: true }).click();
  await page.getByRole('button', { name: 'This works for me', exact: true }).click();
  await page.getByRole('button', { name: 'Settle', exact: true }).click();
  await page.getByRole('button', { name: 'Focus', exact: true }).click();
  await expect(page.getByLabel('Geometry', { exact: true })).toHaveValue('contours');
});
