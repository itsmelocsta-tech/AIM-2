import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('aim_voice_preferences', JSON.stringify({ isMuted: true }));
    window.recognizers = [];
    window.SpeechRecognition = class {
      constructor() { window.recognizers.push(this); }
      start() { this.onstart?.(); }
      stop() { this.onend?.(); }
    };
    window.say = text => window.recognizers[0].onresult?.({ results: [Object.assign([{ transcript: text }], { isFinal: true })] });
  });
});

test('voice conversation submits the latest words once and carries context into the next turn', async ({ page }) => {
  const calls = [];
  await page.route('**/api/aim/chat', async route => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({ json: { reply: `Reply ${calls.length}` } });
  });
  await page.goto('/qa/readability-harness/?modal');
  for (const [index, text] of ['Help me plan my music session.', 'Make that session thirty minutes.'].entries()) {
    await page.getByRole('button', { name: 'Tap to Speak with AIM', exact: true }).click();
    await page.evaluate(text => window.say(text), text);
    await expect(page.getByPlaceholder('Or type here...')).toHaveValue(text);
    await page.getByRole('button', { name: 'Stop Listening', exact: true }).click();
    await expect(page.getByRole('region', { name: 'AIM response', exact: true })).toHaveText(`Reply ${index + 1}`);
    expect(calls).toHaveLength(index + 1);
    expect(calls[index].message).toBe(text);
  }
  expect(calls[1].history).toEqual(expect.arrayContaining([
    expect.objectContaining({ role: 'user', content: 'Help me plan my music session.' }),
    expect.objectContaining({ role: 'aim', content: 'Reply 1' }),
  ]));
});

test('closing a listening conversation discards the unfinished turn', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/aim/chat', async route => { requests++; await route.fulfill({ json: { reply: 'Unexpected reply' } }); });
  await page.goto('/qa/readability-harness/?modal');
  await page.getByRole('button', { name: 'Tap to Speak with AIM', exact: true }).click();
  await page.evaluate(() => window.say('Do not submit this unfinished turn.'));
  await page.getByRole('button', { name: 'Close conversation' }).click();
  await page.getByRole('button', { name: 'Open voice conversation' }).click();
  await expect(page.getByPlaceholder('Or type here...')).toHaveValue('');
  expect(requests).toBe(0);
});

test('permission failure explains recovery without sending a partial voice turn', async ({ page }) => {
  await page.goto('/qa/readability-harness/?modal');
  await page.getByRole('button', { name: 'Tap to Speak with AIM', exact: true }).click();
  await page.evaluate(() => window.recognizers[0].onerror?.({ error: 'not-allowed' }));
  await expect(page.getByRole('status')).toContainText('Allow microphone access');
  await expect(page.getByRole('button', { name: 'Tap to Speak with AIM', exact: true })).toBeVisible();
});

test('an unavailable reply preserves the message for a successful retry', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/aim/chat', route => {
    requests++;
    return route.fulfill(requests === 1 ? { json: { reply: '' } } : { json: { reply: 'Your retry worked.' } });
  });
  await page.goto('/qa/readability-harness/?modal');
  const input = page.getByPlaceholder('Or type here...');
  await input.fill('Keep my message when the service fails.');
  await input.press('Enter');
  await expect(page.getByRole('status')).toContainText('Your message is still here');
  await expect(input).toHaveValue('Keep my message when the service fails.');
  await input.press('Enter');
  await expect(page.getByRole('region', { name: 'AIM response', exact: true })).toHaveText('Your retry worked.');
  expect(requests).toBe(2);
});

test('duplicate sends are ignored and a closed conversation rejects a late reply', async ({ page }) => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  let requests = 0;
  await page.route('**/api/aim/chat', async route => {
    requests++;
    await pending;
    await route.fulfill({ json: { reply: 'This late response must not replace the new conversation.' } });
  });
  await page.goto('/qa/readability-harness/?modal');
  const input = page.getByPlaceholder('Or type here...');
  await input.fill('Send once.');
  await input.press('Enter');
  await input.press('Enter');
  await expect.poll(() => requests).toBe(1);
  await page.getByRole('button', { name: 'Close conversation' }).click();
  await page.getByRole('button', { name: 'Open voice conversation' }).click();
  const delivered = page.waitForResponse(response => response.url().endsWith('/api/aim/chat'));
  release();
  await delivered;
  await expect(page.getByRole('region', { name: 'AIM response', exact: true })).toContainText('What is on your mind');
  await expect(input).toHaveValue('');
  expect(requests).toBe(1);
});
