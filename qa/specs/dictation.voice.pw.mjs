import { test, expect } from '@playwright/test';

async function fakeRecognition(page) {
  await page.addInitScript(() => {
    window.recognizers = [];
    window.SpeechRecognition = class {
      constructor() { this.starts = 0; this.stops = 0; window.recognizers.push(this); }
      start() { this.starts++; this.onstart?.(); }
      stop() { this.stops++; this.onend?.(); }
    };
    window.emitSpeech = (text, final = false, index = window.recognizers.length - 1) => {
      const result = [{ transcript: text }]; result.isFinal = final;
      window.recognizers[index].onresult?.({ results: [result] });
    };
  });
}
const note = page => page.getByPlaceholder('Capture any thought, framework, script, or idea...');
const mic = page => page.getByRole('button', { name: /Speak into Capture/ });
test.beforeEach(async ({ page }) => { await fakeRecognition(page); await page.goto('/qa/dictation-harness/'); });

test('Quick Capture appends editable dictation, restarts after silence, and saves only on Save', async ({ page }, testInfo) => {
  await note(page).fill('My note:');
  await mic(page).click();
  await page.evaluate(() => window.emitSpeech('call'));
  await expect(note(page)).toHaveValue('My note: call');
  await page.evaluate(() => window.emitSpeech('call the client', true));
  await expect(note(page)).toHaveValue('My note: call the client');
  await page.evaluate(() => window.recognizers.at(-1).onend());
  await expect.poll(() => page.evaluate(() => window.recognizers.at(-1).starts)).toBe(2);
  await page.evaluate(() => window.emitSpeech('tomorrow', true));
  await expect(note(page)).toHaveValue('My note: call the client tomorrow');
  await expect(page.getByLabel('Saved captures')).toHaveText('[]');
  await page.getByRole('button', { name: /Stop dictation for Capture/ }).click();
  await page.evaluate(() => window.emitSpeech('late words', true));
  await expect(note(page)).toHaveValue('My note: call the client tomorrow');
  await note(page).fill('Call the client tomorrow at 10.');
  const box = await page.locator('.aim-field-mic').boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('quick-capture-microphone.png') });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByLabel('Saved captures')).toHaveText('["Call the client tomorrow at 10."]');
});

test('task capture stops on Save and close ignores stale callbacks after reopening', async ({ page }) => {
  await page.getByRole('button', { name: 'Today’s Task' }).click();
  const input = page.getByPlaceholder('Enter high-priority action for today...');
  await page.getByRole('button', { name: /Speak into Enter high-priority/ }).click();
  await page.evaluate(() => window.emitSpeech('Finish the draft', true));
  await expect(input).toHaveValue('Finish the draft');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByLabel('Saved captures')).toHaveText('["Finish the draft"]');
  await expect.poll(() => page.evaluate(() => window.recognizers.at(-1).stops)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Open Quick Capture' }).click();
  await page.evaluate(() => window.emitSpeech('Old transcript', true));
  await expect(input).toHaveValue('');
  await page.getByRole('button', { name: /Speak into Enter high-priority/ }).click();
  // Close while actively listening, then verify it cannot update a hidden draft.
  await page.getByRole('button', { name: 'Close Quick Capture' }).click();
  await page.evaluate(() => window.emitSpeech('Hidden transcript', true));
  await page.getByRole('button', { name: 'Open Quick Capture' }).click();
  await expect(input).toHaveValue('');
});

test('field switching, typing, max length, numeric validation and disabled controls are safe', async ({ page }) => {
  await page.getByRole('button', { name: 'Close Quick Capture' }).click();
  const first = page.getByRole('textbox', { name: 'First field', exact: true });
  await page.getByRole('button', { name: 'Speak into First field' }).click();
  const oldIndex = await page.evaluate(() => window.recognizers.length - 1);
  await page.evaluate(() => window.emitSpeech('First draft', true));
  await expect(first).toHaveValue('First draft');
  await page.getByRole('button', { name: 'Speak into Second field' }).click();
  await expect(page.getByRole('button', { name: 'Speak into First field' })).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(i => window.emitSpeech('stale', true, i), oldIndex);
  await expect(first).toHaveValue('First draft');
  await page.evaluate(() => window.emitSpeech('A'.repeat(80), true));
  await expect(page.getByRole('textbox', { name: 'Second field', exact: true })).toHaveValue('A'.repeat(30));
  await page.getByRole('textbox', { name: 'Second field', exact: true }).fill('Edited');
  await page.evaluate(() => window.emitSpeech('Do not overwrite', true));
  await expect(page.getByRole('textbox', { name: 'Second field', exact: true })).toHaveValue('Edited');
  await page.getByRole('button', { name: 'Speak into Number' }).click();
  await page.evaluate(() => window.emitSpeech('nonsense', true));
  await expect(page.getByRole('spinbutton', { name: 'Number', exact: true })).toHaveValue('');
  await expect(page.getByRole('alert')).toContainText('digits');
  await page.evaluate(() => window.emitSpeech('1,250', true));
  await expect(page.getByRole('spinbutton', { name: 'Number', exact: true })).toHaveValue('1250');
  await expect(page.getByRole('button', { name: 'Speak into Read only' })).toBeDisabled();
});

test('permission failures show recovery and another tap retries', async ({ page }) => {
  await mic(page).click();
  await page.evaluate(() => window.recognizers.at(-1).onerror({ error: 'not-allowed' }));
  await expect(page.getByRole('alert')).toContainText('Allow microphone access');
  await expect(mic(page)).toHaveAttribute('aria-pressed', 'false');
  await mic(page).click();
  await page.evaluate(() => window.emitSpeech('Recovered', true));
  await expect(note(page)).toHaveValue('Recovered');
});

test('page hiding stops capture and late events cannot change the draft', async ({ page }) => {
  await mic(page).click();
  await page.evaluate(() => window.emitSpeech('Keep this draft', false));
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect(mic(page)).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => window.emitSpeech('Late hidden words', true));
  await expect(note(page)).toHaveValue('Keep this draft');
});

test('unsupported browser keeps microphone visible and typing available', async ({ page }) => {
  await page.addInitScript(() => { window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; });
  await page.reload(); await mic(page).click();
  await expect(page.getByRole('alert')).toContainText('Voice input is unavailable');
  await note(page).fill('Typed fallback');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByLabel('Saved captures')).toHaveText('["Typed fallback"]');
});
