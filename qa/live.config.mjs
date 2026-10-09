import { defineConfig } from '@playwright/test';

if (!process.env.AIM_PREVIEW_URL || !process.env.AIM_TESTED_SHA) {
  throw new Error('BLOCKED: an exact-head READY preview URL and tested SHA are required.');
}
export default defineConfig({
  testDir: './specs',
  testMatch: '**/*.live.pw.mjs',
  workers: 1,
  retries: 0,
  timeout: 45000,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/live', open: 'never' }]],
  use: {
    baseURL: process.env.AIM_PREVIEW_URL,
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    trace: 'off', video: 'off', screenshot: 'off',
  },
});
