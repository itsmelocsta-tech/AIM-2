import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
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
