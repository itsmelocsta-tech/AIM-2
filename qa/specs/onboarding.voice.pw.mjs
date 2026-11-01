import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => { throw error; });
  // Fictional recognition events only; no recording, account, or paid AI request.
  await page.route('**/api/aim/**', route => route.fulfill({ status: 503, json: { error: 'isolated voice regression' } }));
  await page.addInitScript(() => {
    window.recognizers = [];
    window.SpeechRecognition = class {
      constructor() { this.starts = 0; window.recognizers.push(this); }
      start() { this.starts++; this.onstart?.(); }
      stop() {}
    };
    window.emitResultList = (entries, resultIndex = 0) => {
      const results = entries.map(([text, final]) => Object.assign([{ transcript: text }], { isFinal: final }));
      window.recognizers[0].onresult?.({ results, resultIndex });
    };
    localStorage.setItem('aim_voice_preferences', JSON.stringify({ isMuted: true }));
  });
});

for (const final of [false, true]) {
  test(`onboarding replaces growing Samsung result-list fragments (final=${final})`, async ({ page }, testInfo) => {
    await page.goto('/qa/onboarding-voice-harness/');
    const answer = page.locator('#aim-current-state-textarea');
    await answer.fill('My situation:');
    await page.getByRole('button', { name: 'Dictate with Voice', exact: true }).click();
    const fragments = ["I'm", "I'm testing", "I'm testing the", "I'm testing the mic", "I'm testing the mic to see"];
    for (let n = 1; n <= fragments.length; n++) {
      await page.evaluate(({ fragments, n, final }) => window.emitResultList(fragments.slice(0, n).map(text => [text, final]), n - 1), { fragments, n, final });
      await expect(answer).toHaveValue('My situation: ' + fragments[n - 1]);
    }
    // A cumulative final result replaces the interim snapshot, not the visible draft.
    await page.evaluate(() => window.emitResultList([["I'm testing the mic to see if it repeats", true]]));
    await expect(answer).toHaveValue("My situation: I'm testing the mic to see if it repeats");
    // Preserve the phrase across silence and reject a replay from the prior session.
    await page.evaluate(() => window.recognizers[0].onend());
    await expect.poll(() => page.evaluate(() => window.recognizers[0].starts)).toBe(2);
    await page.evaluate(() => window.emitResultList([["I'm testing the mic to see if it repeats", true], ['without an echo', false]]));
    await expect(answer).toHaveValue("My situation: I'm testing the mic to see if it repeats without an echo");
    await page.getByRole('button', { name: /Listening.*dictating live/ }).click();
    await page.evaluate(() => window.emitResultList([['late duplicate', true]]));
    await expect(answer).toHaveValue("My situation: I'm testing the mic to see if it repeats without an echo");
    await answer.fill('My corrected answer, reviewed before continuing.');
    await page.screenshot({ path: testInfo.outputPath('onboarding-dictation-reviewed.png') });
    await page.getByRole('button', { name: 'Next: What you want to change' }).click();
    await expect(page.locator('#aim-changes-wanted-textarea')).toBeVisible();
  });
}

test('life update replaces each cumulative transcript instead of appending it', async ({ page }) => {
  await page.goto('/qa/onboarding-voice-harness/?life-update');
  const answer = page.getByPlaceholder('Tell me what changed…');
  await answer.fill('My note:');
  await page.getByRole('button', { name: 'Dictate with Voice', exact: true }).click();
  for (const text of ['I', 'I changed', 'I changed my schedule']) {
    await page.evaluate(text => window.emitResultList([[text, false]]), text);
    await expect(answer).toHaveValue('My note: ' + text);
  }
});

test('answer controls sit inside the answer corner and Back preserves all drafts', async ({ page }, testInfo) => {
  await page.goto('/qa/onboarding-voice-harness/');
  await page.locator('#aim-current-state-textarea').fill('My original situation');
  await page.getByRole('button', { name: 'Next: What you want to change' }).click();
  const change = page.locator('#aim-changes-wanted-textarea');
  await change.fill('My requested change');
  await expect(page.locator('#aim-box-speaker-btn-2')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Listen', exact: true })).toHaveCount(1);
  const box = await change.boundingBox();
  const controls = await page.getByTestId('answer-voice-controls').boundingBox();
  expect(controls.y).toBeGreaterThan(box.y);
  expect(controls.y + controls.height).toBeLessThan(box.y + box.height);
  expect(controls.x + controls.width).toBeLessThanOrEqual(box.x + box.width);
  await page.getByRole('button', { name: 'Dictate with Voice', exact: true }).click();
  await page.evaluate(() => window.emitResultList([['with voice', false]]));
  await expect(change).toHaveValue('My requested change with voice');
  await page.locator('#aim-back-to-current-state').click();
  await expect(page.locator('#aim-current-state-textarea')).toHaveValue('My original situation');
  await expect(page.locator('#aim-onboarding-step-1')).toBeVisible();
  await page.evaluate(() => window.emitResultList([['late result', true]]));
  await page.getByRole('button', { name: 'Next: What you want to change' }).click();
  await expect(change).toHaveValue('My requested change with voice');
  await page.getByRole('button', { name: 'Next: Who you want to be' }).click();
  await page.locator('#aim-desired-state-textarea').fill('My future goal');
  await page.locator('#aim-back-to-changes').click();
  await expect(change).toHaveValue('My requested change with voice');
  await page.getByRole('button', { name: 'Next: Who you want to be' }).click();
  await expect(page.locator('#aim-desired-state-textarea')).toHaveValue('My future goal');
  await page.screenshot({ path: testInfo.outputPath('onboarding-controls-and-back.png'), fullPage: true });
});


test('approved brief copy, icon controls, and Back survives audio cleanup failure', async ({ page }, testInfo) => {
  await page.goto('/qa/onboarding-voice-harness/');
  await expect(page.getByRole('heading', { name: 'Hello. I’m AIM.', exact: true })).toBeVisible();
  await expect(page.getByText('Step 1: Who are you?', { exact: true })).toBeVisible();
  await expect(page.locator('#aim-box-speaker-btn-1')).toHaveCount(0);
  await expect(page.getByText('Write as much as you need', { exact: true })).toHaveCount(0);
  await page.locator('#aim-current-state-textarea').fill('My saved situation');
  await page.getByRole('button', { name: 'Next: What you want to change' }).click();
  await expect(page.getByRole('heading', { name: 'What do you want to change?', exact: true })).toBeVisible();
  await expect(page.getByText('Tell me what you want to be different.', { exact: true })).toBeVisible();
  await expect(page.getByText('Unlimited space', { exact: true })).toHaveCount(0);
  const controls = page.getByTestId('answer-voice-controls');
  await expect(controls).toHaveText('');
  await expect(controls.getByRole('button')).toHaveCount(2);
  await page.locator('#aim-changes-wanted-textarea').fill('My saved change');
  await page.screenshot({ path: testInfo.outputPath('approved-page-2.png'), fullPage: true });
  await page.evaluate(() => window.failVoiceCleanup());
  await page.locator('#aim-back-to-current-state').click();
  await expect(page.locator('#aim-current-state-textarea')).toHaveValue('My saved situation');
});


test('page three uses goal copy and icons; Back preserves drafts and stops dictation', async ({ page }, testInfo) => {
  await page.goto('/qa/onboarding-voice-harness/');
  await page.locator('#aim-current-state-textarea').fill('My situation');
  await page.getByRole('button', { name: 'Next: What you want to change' }).click();
  await page.locator('#aim-changes-wanted-textarea').fill('My change');
  await page.getByRole('button', { name: 'Next: Who you want to be' }).click();
  await expect(page.getByRole('heading', { name: 'What’s your goal in the end?', exact: true })).toBeVisible();
  await expect(page.getByText('Describe the life you’re working toward: money, relationships, health, or anything else that matters to you.', { exact: true })).toBeVisible();
  const controls = page.getByTestId('answer-voice-controls');
  await expect(controls).toHaveText('');
  await expect(controls.getByRole('button')).toHaveCount(2);
  const goal = page.locator('#aim-desired-state-textarea');
  await goal.fill('My goal');
  await controls.getByRole('button', { name: 'Dictate with Voice', exact: true }).click();
  await page.evaluate(() => window.emitResultList([['is achievable', false]]));
  await expect(goal).toHaveValue('My goal is achievable');
  await page.locator('#aim-back-to-changes').click();
  await expect(page.locator('#aim-changes-wanted-textarea')).toHaveValue('My change');
  await page.evaluate(() => window.emitResultList([['late wrong-field result', true]]));
  await expect(page.locator('#aim-changes-wanted-textarea')).toHaveValue('My change');
  await page.getByRole('button', { name: 'Next: Who you want to be' }).click();
  await expect(goal).toHaveValue('My goal is achievable');
  await expect(page.getByRole('button', { name: 'Build my starting plan', exact: true })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('approved-page-3.png'), fullPage: true });
  await page.evaluate(() => window.failVoiceCleanup());
  await page.locator('#aim-back-to-changes').click();
  await expect(page.locator('#aim-changes-wanted-textarea')).toHaveValue('My change');
});


test('starting-point intro stays brief and opens the next guide step', async ({ page }, testInfo) => {
  await page.goto('/qa/onboarding-voice-harness/?guide');
  await expect(page.getByRole('heading', { name: 'Your starting point is ready.', exact: true })).toBeVisible();
  await expect(page.getByText('You said you want to become: An artist with a finished book', { exact: true })).toBeVisible();
  await expect(page.getByText(/A first step for today:/)).toHaveCount(0);
  const next = page.getByRole('button', { name: 'Show me today’s plan', exact: true });
  await expect(next).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('approved-brief-starting-point.png'), fullPage: true });
  await next.click();
  await expect(page.getByRole('heading', { name: 'Here’s your plan for today.', exact: true })).toBeVisible();
  await expect(page.getByText('You can change a task here as your day changes.', { exact: true })).toBeVisible();
});
