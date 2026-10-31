import { test, expect } from '@playwright/test';
const reply = ('Here is a clear, practical response you can read at your own pace. Choose one useful action, make room for it today, and review what happened.\n\n').repeat(10) +
  'Long text also wraps: ' + 'ExampleLongWord'.repeat(18) + '\n\nEND OF REPLY';
test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => { throw error; });
  await page.addInitScript(() => localStorage.setItem('aim_voice_preferences', JSON.stringify({ isMuted: true })));
  await page.route('**/api/aim/**', route => route.fulfill({ status: 200, json: { reply } }));
});
for (const modal of [false, true]) {
  test(`${modal ? 'Voice conversation' : 'Home reflection'} gives long replies readable space and keeps input reachable`, async ({ page }, info) => {
    await page.goto('/qa/readability-harness/' + (modal ? '?modal' : ''));
    if (modal) {
      await page.getByPlaceholder('Or type here...').fill('Show a long response.');
      await page.getByPlaceholder('Or type here...').press('Enter');
    }
    const region = page.getByRole('region', { name: modal ? 'AIM response' : 'Latest AIM response', exact: true });
    await expect(region.getByText(reply, { exact: true })).toBeVisible();
    const metrics = await region.evaluate(el => {
      const style = getComputedStyle(el), box = el.getBoundingClientRect();
      return { font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight), width: box.width, height: box.height,
        fits: el.scrollWidth <= el.clientWidth + 1, fullHeight: el.scrollHeight <= el.clientHeight + 1 };
    });
    expect(metrics.font).toBeGreaterThanOrEqual(16);
    expect(metrics.line).toBeGreaterThanOrEqual(24);
    expect(metrics.width).toBeGreaterThanOrEqual(Math.min(300, page.viewportSize().width * 0.78));
    expect(metrics.height).toBeGreaterThan(200);
    expect(metrics.fits).toBe(true);
    expect(metrics.fullHeight).toBe(true); // No tiny independently clipped response window.
    await region.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath('readable-response.png') });
    if (!modal) await page.getByRole('button', { name: 'Type instead', exact: true }).click();
    const input = modal ? page.getByPlaceholder('Or type here...') : page.locator('#aim-home-text-input');
    // A reduced viewport checks the keyboard-space layout, not a physical iPhone keyboard.
    await page.setViewportSize({ width: page.viewportSize().width, height: 360 });
    await input.scrollIntoViewIfNeeded();
    await input.fill('My next message stays editable.');
    await expect(input).toBeInViewport();
    await expect(input).toHaveValue('My next message stays editable.');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    if (modal) {
      const box = await page.getByRole('dialog').boundingBox();
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.height).toBeLessThanOrEqual(360);
    }
    await expect(region).toContainText('END OF REPLY');
    await page.screenshot({ path: info.outputPath('reduced-viewport-input.png') });
  });
}
