import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.deviceVoiceCalls = 0;
    window.speechSynthesis.speak = () => { window.deviceVoiceCalls++; };
  });
});
test('voice failure shows retry and never substitutes a robotic device voice', async ({ page }) => {
  await page.route('**/api/aim/voice/speak', route => route.fulfill({ status: 503, json: { code: 'natural_voice_unavailable' } }));
  await page.goto('/qa/voice-harness/');
  const preview = page.locator('#aim-voice-preview-toggle-btn');
  await preview.click();
  await expect(page.getByText('Natural voice is temporarily unavailable. Your written response is still available. Please try again.', { exact: true })).toBeVisible();
  await expect(preview).toContainText('Play');
  expect(await page.evaluate(() => window.deviceVoiceCalls)).toBe(0);
});
test('selection sends the selected voice identity and recovers for another preview', async ({ page }) => {
  const requests = [];
  await page.route('**/api/aim/voice/speak', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 503, json: { code: 'natural_voice_unavailable' } });
  });
  await page.goto('/qa/voice-harness/');
  await page.locator('#aim-voice-type-feminine').click();
  await page.locator('#aim-voice-accent-southern').click();
  await page.locator('#aim-voice-preview-toggle-btn').click();
  await expect(page.getByText(/Natural voice is temporarily unavailable/)).toBeVisible();
  await page.locator('#aim-voice-accent-midwestern').click();
  await page.locator('#aim-voice-preview-toggle-btn').click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests.map(x => x.voiceProfileId)).toEqual(['feminine_southern', 'feminine_midwestern']);
  expect(await page.evaluate(() => window.deviceVoiceCalls)).toBe(0);
});
